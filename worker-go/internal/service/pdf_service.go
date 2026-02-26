package service

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"pdf-worker/internal/domain"
	"regexp"
	"strconv"
	"strings"
	"time"

	"pdf-worker/internal/logger"
)

var commonPasswords = []string{

	"123456", "12345", "12345678", "password", "123456789", "1234", "1234567", "111111",
	"123123", "000000", "admin", "secret", "pdf", "document", "user", "master",
}

type PdfService struct {
	log          *logger.Logger
	heavyTaskSem chan struct{}
}

func NewPdfService(l *logger.Logger) *PdfService {

	return &PdfService{
		log:          l,
		heavyTaskSem: make(chan struct{}, 2),
	}

}

func (s *PdfService) executeHeavyTask(actionName string, inputPath string, task func() domain.Response) domain.Response {

	s.log.Info("Queueing heavy task: %s | File: %s", actionName, filepath.Base(inputPath))
	s.heavyTaskSem <- struct{}{}

	start := time.Now()
	s.log.Info("Started heavy task: %s | File: %s", actionName, filepath.Base(inputPath))

	defer func() {

		<-s.heavyTaskSem
		s.log.TrackTime(start, actionName, inputPath)

	}()

	return task()

}

type PdfInfo struct {
	PageCount int    `json:"pages"`
	Version   string `json:"version"`
	Encrypted bool   `json:"encrypted"`
	FileSize  int64  `json:"size"`
	Author    string `json:"author"`

	CanCompress bool `json:"can_compress"`
	CanSplit    bool `json:"can_split"`
	CanMerge    bool `json:"can_merge"`

	HasMetadata bool `json:"has_metadata"`
	HasImages   bool `json:"has_images"`
	HasText     bool `json:"has_text"`
	IsScanned   bool `json:"is_scanned"`

	IsCorrupt      bool   `json:"is_corrupt"`
	CantCompReason string `json:"cant_compress_reason"`
}

func (s *PdfService) GetInfo(req domain.Request) domain.Response {

	fileInfo, err := os.Stat(req.InputPath)
	var size int64 = 0
	if err == nil {

		size = fileInfo.Size()

	}

	info := PdfInfo{

		FileSize:    size,
		Author:      "No author",
		HasMetadata: true,
		CanSplit:    true,
		CanMerge:    true,
	}

	outputBytes, err := exec.Command("pdfinfo", req.InputPath).CombinedOutput()
	output := string(outputBytes)
	lowerOutput := strings.ToLower(output)

	s.log.Debug("[DEBUG] pdfinfo output for %s:\n%s\n----------------\n", filepath.Base(req.InputPath), output)

	parsePdfInfoOutput(output, &info)

	isEncrypted := strings.Contains(lowerOutput, "incorrect password") ||
		strings.Contains(lowerOutput, "encrypted: yes") ||
		strings.Contains(lowerOutput, "password required")

	if err != nil {

		if isEncrypted {

			info.Encrypted = true
			info.IsCorrupt = false
			info.CantCompReason = "File is encrypted"
			parsePdfInfoOutput(output, &info)
			return domain.Response{Status: "ok", Info: info}

		}

		info.IsCorrupt = true
		info.CantCompReason = "File is corrupted or invalid"
		info.CanCompress = false
		info.CanMerge = false
		info.CanSplit = false

		return domain.Response{Status: "ok", Info: info}

	}

	if !info.Encrypted {

		cmdText := exec.Command("pdftotext", "-l", "1", req.InputPath, "-")
		outputBytes, errText := cmdText.CombinedOutput()

		if errText == nil {

			text := strings.TrimSpace(string(outputBytes))
			if len(text) < 5 {

				info.IsScanned = true

			}

		}

	}

	info.CanSplit = true
	info.CanMerge = true
	info.HasMetadata = true

	if info.IsScanned {

		info.CanCompress = false
		info.CantCompReason = "Scanned documents(or images)"

	} else {

		info.CanCompress = true

	}

	return domain.Response{Status: "ok", Info: info}

}

func (s *PdfService) Compress(req domain.Request) domain.Response {

	return s.executeHeavyTask("Compress", req.InputPath, func() domain.Response {

		outputPath := getOutputPath(req.InputPath, "_opt.pdf")

		cmd := exec.Command("gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4", "-dPDFSETTINGS=/ebook", "-dNOPAUSE", "-dQUIET", "-dBATCH", fmt.Sprintf("-sOutputFile=%s", outputPath), req.InputPath)

		if output, err := cmd.CombinedOutput(); err != nil {

			s.log.Error("Compress failed for %s: %s", filepath.Base(req.InputPath), cleanError(string(output)))

			return domain.Response{Status: "error", Error: cleanError(string(output))}

		}

		return domain.Response{Status: "ok", Path: outputPath}

	})

}

func (s *PdfService) Encrypt(req domain.Request) domain.Response {

	outputPath := getOutputPath(req.InputPath, "_enc.pdf")
	cmd := exec.Command("qpdf", "--encrypt", req.Password, req.Password, "256", "--", req.InputPath, outputPath)
	output, err := cmd.CombinedOutput()

	if err != nil {

		if info, statErr := os.Stat(outputPath); statErr == nil && info.Size() > 0 {

			return domain.Response{Status: "ok", Path: outputPath}

		}

		s.log.Error("Encrypt failed for %s: %s", filepath.Base(req.InputPath), cleanError(string(output)))
		return domain.Response{Status: "error", Error: cleanError(string(output))}

	}

	return domain.Response{Status: "ok", Path: outputPath}
}

func (s *PdfService) Decrypt(req domain.Request) domain.Response {
	outputPath := getOutputPath(req.InputPath, "_dec.pdf")
	cmd := exec.Command("qpdf", "--decrypt", "--password="+req.Password, req.InputPath, outputPath)

	if output, err := cmd.CombinedOutput(); err != nil {

		if strings.Contains(string(output), "invalid password") {

			return domain.Response{Status: "error", Error: "Wrong password"}
		}

		if info, statErr := os.Stat(outputPath); statErr == nil && info.Size() > 0 {

			return domain.Response{Status: "ok", Path: outputPath}

		}
		s.log.Error("Decrypt failed for %s: %s", filepath.Base(req.InputPath), cleanError(string(output)))
		return domain.Response{Status: "error", Error: cleanError(string(output))}
	}
	return domain.Response{Status: "ok", Path: outputPath}
}

func (s *PdfService) Crack(req domain.Request) domain.Response {
	return s.executeHeavyTask("Crack", req.InputPath, func() domain.Response {

		outputPath := getOutputPath(req.InputPath, "_cracked.pdf")

		for _, pwd := range commonPasswords {

			cmd := exec.Command("qpdf", "--decrypt", "--password="+pwd, req.InputPath, outputPath)

			if err := cmd.Run(); err == nil {

				s.log.Info("Successfully cracked password for %s", filepath.Base(req.InputPath))
				return domain.Response{Status: "ok", Path: outputPath, Info: pwd}

			}
		}
		s.log.Info("Failed to crack password for %s: Too strong", filepath.Base(req.InputPath))
		return domain.Response{Status: "error", Error: "Password is too strong"}

	})

}

func (s *PdfService) Repair(req domain.Request) domain.Response {

	return s.executeHeavyTask("Repair", req.InputPath, func() domain.Response {

		outputPath := getOutputPath(req.InputPath, "_repaired.pdf")

		origStat, _ := os.Stat(req.InputPath)
		origSize := int64(0)

		if origStat != nil {

			origSize = origStat.Size()

		}
		s.log.Debug("\n[DEBUG] === START REPAIR: %s (Size: %d bytes) ===\n", filepath.Base(req.InputPath), origSize)

		isRecoverySuccessful := func(path string, toolName string) bool {

			info, err := os.Stat(path)

			if err != nil || info.Size() == 0 {

				s.log.Debug("[DEBUG] ❌ %s FAILED: File missing or 0 bytes.\n", toolName)
				return false

			}

			outSize := info.Size()
			s.log.Debug("[DEBUG] 🟢 %s created file. Size: %d bytes.\n", toolName, outSize)

			if origSize > 1000000 && outSize < 10000 {

				s.log.Debug("[DEBUG] ❌ %s FAILED: File is a dummy wrapper (<10KB).\n", toolName)
				return false

			}

			cmd := exec.Command("pdfinfo", path)
			outBytes, _ := cmd.CombinedOutput()
			outStr := strings.ToLower(string(outBytes))

			s.log.Debug("[DEBUG] 🔎 %s pdfinfo output:\n%s\n", toolName, outStr)

			if strings.Contains(outStr, "pages:") {

				if strings.Contains(outStr, "pages:          0") || strings.Contains(outStr, "pages: 0") {

					s.log.Debug("[DEBUG] ❌ %s FAILED: pdfinfo reports 0 pages.\n", toolName)
					return false

				}

				s.log.Debug("[DEBUG] ✅ %s SUCCESS: Valid PDF structure found.\n", toolName)
				return true
			}

			s.log.Debug("[DEBUG] ❌ %s FAILED: pdfinfo could not find 'pages:' keyword.\n", toolName)
			return false
		}

		exec.Command("pdftocairo", "-pdf", req.InputPath, outputPath).Run()

		if isRecoverySuccessful(outputPath, "PDFTOCAIRO") {

			return domain.Response{Status: "ok", Path: outputPath}

		}

		os.Remove(outputPath)

		exec.Command("mutool", "clean", req.InputPath, outputPath).Run()

		if isRecoverySuccessful(outputPath, "QPDF") {

			return domain.Response{Status: "ok", Path: outputPath}

		}
		os.Remove(outputPath)

		exec.Command("qpdf", req.InputPath, outputPath).Run()

		if isRecoverySuccessful(outputPath, "MUTOOL") {

			return domain.Response{Status: "ok", Path: outputPath}

		}
		os.Remove(outputPath)

		exec.Command("gs", "-o", outputPath, "-sDEVICE=pdfwrite", "-dPDFSETTINGS=/prepress", req.InputPath).Run()

		if isRecoverySuccessful(outputPath, "GS") {

			return domain.Response{Status: "ok", Path: outputPath}

		}
		os.Remove(outputPath)

		s.log.Error("REPAIR COMPLETELY FAILED for %s\n", filepath.Base(req.InputPath))
		return domain.Response{
			Status: "error",
			Error:  "File data is completely destroyed. Recovery is impossible.",
		}

	})

}

func (s *PdfService) Split(req domain.Request) domain.Response {

	return s.executeHeavyTask("Split", req.InputPath, func() domain.Response {

		cleanPages := NormalizePages(req.Pages)
		if cleanPages == "" {

			return domain.Response{Status: "error", Error: "Invalid page range format"}

		}

		pagesArray, err := parsePages(cleanPages)
		if err != nil || len(pagesArray) == 0 {

			return domain.Response{Status: "error", Error: "Invalid page range format"}

		}

		pageCount := len(pagesArray)

		tempDir, err := os.MkdirTemp("", "pdf_split_*")
		if err != nil {

			s.log.Error("Failed to create temp dir: %v", err)
			return domain.Response{Status: "error", Error: "Failed to create temp dir"}

		}

		defer os.RemoveAll(tempDir)

		baseName := req.OriginalName
		if baseName == "" {

			baseName = "Document"

		} else {

			baseName = strings.TrimSuffix(baseName, filepath.Ext(baseName))

		}
		var safePaths []string
		var beautifulNames []string
		for _, p := range pagesArray {

			safeName := fmt.Sprintf("%d.pdf", p)
			safePath := filepath.Join(tempDir, safeName)

			beautifulName := fmt.Sprintf("%s-page_%d.pdf", baseName, p)

			argsSingle := []string{req.InputPath, "--pages", ".", strconv.Itoa(p), "--", safePath}
			cmdSingle := exec.Command("qpdf", argsSingle...)

			output, cmdErr := cmdSingle.CombinedOutput()

			if _, statErr := os.Stat(safePath); statErr == nil {

				safePaths = append(safePaths, safePath)
				beautifulNames = append(beautifulNames, beautifulName)

			} else {

				s.log.Error("Failed to extract page %d | statErr: %v | cmdErr: %v | Output: %s", p, statErr, cmdErr, string(output))

			}

		}

		if len(safePaths) == 0 {

			return domain.Response{Status: "error", Error: "Failed extract any pages. Check range"}

		}

		pdfOutputPath := getOutputPath(req.InputPath, "_splitted.pdf")
		mergeArgs := []string{"--empty", "--pages"}
		mergeArgs = append(mergeArgs, safePaths...)
		mergeArgs = append(mergeArgs, "--", pdfOutputPath)

		cmdMerge := exec.Command("qpdf", mergeArgs...)
		outputMerge, _ := cmdMerge.CombinedOutput()
		if _, statErr := os.Stat(pdfOutputPath); statErr != nil {

			s.log.Error("Failed to merge extracted pages: %s", cleanError(string(outputMerge)))
			return domain.Response{Status: "error", Error: "Failed to build final PDF"}

		}

		if pageCount <= 10 {

			s.log.Info("Successfully split %d pages into PDF %s", pageCount, filepath.Base(pdfOutputPath))
			return domain.Response{Status: "ok", Path: pdfOutputPath}

		}

		for i, safePath := range safePaths {

			beautifulPath := filepath.Join(tempDir, beautifulNames[i])
			os.Rename(safePath, beautifulPath)

		}

		zipOutputPath := getOutputPath(req.InputPath, "_splitted.zip")
		if err := zipDir(tempDir, zipOutputPath); err != nil {

			s.log.Error("Zip creation failed: %v", err)
			return domain.Response{Status: "ok", Path: pdfOutputPath}

		}

		s.log.Info("Successfully split %d pages into PDF and ZIP", pageCount)
		return domain.Response{Status: "ok", Path: pdfOutputPath, ZipPath: zipOutputPath}

	})

}

func (s *PdfService) Merge(req domain.Request) domain.Response {

	if len(req.InputPaths) < 2 {

		return domain.Response{Status: "error", Error: "Need at least 2 files to merge"}

	}

	return s.executeHeavyTask("Merge", req.InputPaths[0], func() domain.Response {

		outputPath := getOutputPath(req.InputPaths[0], "_merged.pdf")

		args := []string{"--empty", "--pages"}
		args = append(args, req.InputPaths...)
		args = append(args, "--", outputPath)

		cmd := exec.Command("qpdf", args...)

		if output, err := cmd.CombinedOutput(); err != nil {

			s.log.Error("Merge failed: %s", cleanError(string(output)))
			return domain.Response{Status: "error", Error: cleanError(string(output))}

		}

		s.log.Info("Successfully merged %d files into %s", len(req.InputPaths), filepath.Base(outputPath))
		return domain.Response{Status: "ok", Path: outputPath}

	})

}

// --- Helpers ---
func parsePdfInfoOutput(output string, info *PdfInfo) {
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		parts := strings.SplitN(line, ":", 2)
		if len(parts) < 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])

		switch key {
		case "Pages":
			info.PageCount, _ = strconv.Atoi(val)
		case "PDF version":
			info.Version = val
		case "Author":
			if val != "" {
				info.Author = val
			}
		case "Encrypted":
			if strings.Contains(strings.ToLower(val), "yes") {
				info.Encrypted = true
			}
		}
	}
}

func getOutputPath(path string, suffix string) string {
	ext := filepath.Ext(path)
	base := path[0 : len(path)-len(ext)]
	return base + suffix
}

func cleanError(output string) string {

	lower := strings.ToLower(output)
	if strings.Contains(lower, "unable to find page tree") || strings.Contains(lower, "no pages") {

		return "Zombie PDF: cant restore it"

	}

	if len(output) > 250 {

		return output[:250] + "..."

	}

	return output

}

func isValidPdf(filePath string) bool {

	cmd := exec.Command("pdfinfo", filePath)
	outputBytes, _ := cmd.CombinedOutput()

	output := strings.ToLower(string(outputBytes))

	if strings.Contains(output, "pages:") {

		if strings.Contains(output, "pages:          0") || strings.Contains(output, "pages: 0") {
			return false
		}
		return true
	}

	return false

}

func NormalizePages(input string) string {

	input = strings.ReplaceAll(input, "(", "")
	input = strings.ReplaceAll(input, ")", "")
	input = strings.ReplaceAll(input, "[", "")
	input = strings.ReplaceAll(input, "]", "")

	input = strings.ReplaceAll(input, ":", "-")
	input = strings.ReplaceAll(input, "_", "-")

	input = strings.ReplaceAll(input, " ", ",")
	input = strings.ReplaceAll(input, ".", ",")
	input = strings.ReplaceAll(input, ";", ",")

	reComma := regexp.MustCompile(`,+`)
	input = reComma.ReplaceAllString(input, ",")
	reDash := regexp.MustCompile(`-+`)
	input = reDash.ReplaceAllString(input, "-")

	input = strings.Trim(input, ",- ")

	return input

}

func parsePages(input string) ([]int, error) {

	input = NormalizePages(input)
	parts := strings.Split(input, ",")

	var pages []int

	for _, part := range parts {

		if strings.Contains(part, "-") {

			bounds := strings.Split(part, "-")
			if len(bounds) == 2 {

				start, err1 := strconv.Atoi(bounds[0])
				end, err2 := strconv.Atoi(bounds[1])
				if err1 == nil && err2 == nil && start <= end {

					for i := start; i <= end; i++ {

						pages = append(pages, i)

					}

				}

			}

		} else {

			p, err := strconv.Atoi(part)
			if err == nil {

				pages = append(pages, p)

			}

		}

	}
	return pages, nil

}

func addFileToZip(archive *zip.Writer, filePath string) error {

	file, err := os.Open(filePath)
	if err != nil {

		return err

	}

	defer file.Close()

	w, err := archive.Create(filepath.Base(filePath))
	if err != nil {

		return err

	}

	_, err = io.Copy(w, file)
	return err

}

func zipDir(sourceDir, zipPath string)error{
	
	zipFile,err := os.Create(zipPath)
	if err != nil{
		
		return err
		
	}
	
	defer zipFile.Close()
	
	archive := zip.NewWriter(zipFile)
	defer archive.Close()
	
	entries, err := os.ReadDir(sourceDir)
	if err != nil{
		
		return err
		
	}
	
	for _, entry := range entries{
		
		if entry.IsDir(){
			
			continue
			
		}
		
		filePath := filepath.Join(sourceDir,entry.Name())
		if err := addFileToZip(archive, filePath);err != nil{
			
			return err
			
		}
		
	}
	
	return nil
	
}

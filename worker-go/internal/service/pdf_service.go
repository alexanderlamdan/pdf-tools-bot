package service

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"pdf-worker/internal/domain"
	"strconv"
	"strings"
)

var commonPasswords = []string{

	"123456", "12345", "12345678", "password", "123456789", "1234", "1234567", "111111",
	"123123", "000000", "admin", "secret", "pdf", "document", "user", "master",
}

type PdfService struct{}

func NewPdfService() *PdfService {

	return &PdfService{}

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

	fmt.Printf("[DEBUG] pdfinfo output for %s:\n%s\n----------------\n", filepath.Base(req.InputPath), output)

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

	outputPath := getOutputPath(req.InputPath, "_opt.pdf")

	cmd := exec.Command("gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4", "-dPDFSETTINGS=/ebook", "-dNOPAUSE", "-dQUIET", "-dBATCH", fmt.Sprintf("-sOutputFile=%s", outputPath), req.InputPath)

	if output, err := cmd.CombinedOutput(); err != nil {

		return domain.Response{Status: "error", Error: fmt.Sprintf("GS Error: %s", string(output))}

	}

	return domain.Response{Status: "ok", Path: outputPath}

}

func (s *PdfService) Encrypt(req domain.Request) domain.Response {

	outputPath := getOutputPath(req.InputPath, "_enc.pdf")
	cmd := exec.Command("qpdf", "--encrypt", req.Password, req.Password, "256", "--", req.InputPath, outputPath)
	output, err := cmd.CombinedOutput()

	if err != nil {

		if info, statErr := os.Stat(outputPath); statErr == nil && info.Size() > 0 {

			return domain.Response{Status: "ok", Path: outputPath}

		}

		return domain.Response{Status: "error", Error: string(output)}

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

		return domain.Response{Status: "error", Error: string(output)}
	}
	return domain.Response{Status: "ok", Path: outputPath}
}

func (s *PdfService) Crack(req domain.Request) domain.Response {
	outputPath := getOutputPath(req.InputPath, "_cracked.pdf")
	for _, pwd := range commonPasswords {
		cmd := exec.Command("qpdf", "--decrypt", "--password="+pwd, req.InputPath, outputPath)
		if err := cmd.Run(); err == nil {
			return domain.Response{Status: "ok", Path: outputPath, Info: pwd}
		}
	}
	return domain.Response{Status: "error", Error: "Password is too strong"}
}

func (s *PdfService) Repair(req domain.Request) domain.Response {

	outputPath := getOutputPath(req.InputPath, "_repaired.pdf")

	origStat, _ := os.Stat(req.InputPath)
	origSize := int64(0)

	if origStat != nil {

		origSize = origStat.Size()

	}

	cmdMutool := exec.Command("mutool", "clean", req.InputPath, outputPath)
	cmdMutool.Run()

	if info, err := os.Stat(outputPath); err == nil && info.Size() > 0 {

		if origSize > 1000000 && info.Size() < 10000 {

			os.Remove(outputPath)

		} else {

			return domain.Response{Status: "ok", Path: outputPath}

		}

	}

	cmdQPDF := exec.Command("qpdf", req.InputPath, outputPath)
	cmdQPDF.Run()

	if info, err := os.Stat(outputPath); err == nil && info.Size() > 0 {

		if origSize > 1000000 && info.Size() < 10000 {

			os.Remove(outputPath)

		} else {

			return domain.Response{Status: "ok", Path: outputPath}

		}

	}

	cmdGS := exec.Command("gs", "-o", outputPath, "-sDEVICE=pdfwrite", "-dPDFSETTINGS=/prepress", req.InputPath)
	cmdGS.Run()

	if info, err := os.Stat(outputPath); err == nil && info.Size() > 0 {

		if origSize > 1000000 && info.Size() < 10000 {

			os.Remove(outputPath)
			return domain.Response{

				Status: "error",
				Error:  "Recovery failed: content is completely unreadable. Resulting file was empty.",
			}
		}

		return domain.Response{Status: "ok", Path: outputPath}

	}

	return domain.Response{

		Status: "error",
		Error:  "File data is completely destroyed or missing. Recovery is impossible.",
	}

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

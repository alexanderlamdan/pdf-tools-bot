package ops

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/logger"
	"pdf-worker/internal/service/utils"
)

func Split(req domain.Request, log *logger.Logger) domain.Response {

	cleanPages := NormalizePages(req.Pages)
	if cleanPages == "" {
		return domain.Response{Status: "error", Error: "Invalid page range format"}
	}

	pagesArray, err := parsePages(cleanPages)
	if err != nil || len(pagesArray) == 0 {
		return domain.Response{Status: "error", Error: "Invalid page range format"}
	}

	if len(pagesArray) == 1 {
		return domain.Response{Status: "error", Error: "Cannot split: only 1 page selected. Please specify at least 2 pages."}
	}

	tempDir, err := os.MkdirTemp("", "pdf_split_*")
	if err != nil {
		log.Error("Failed to create temp dir: %v", err)
		return domain.Response{Status: "error", Error: "Failed to create temp dir"}
	}
	defer os.RemoveAll(tempDir)

	baseName := req.OriginalName
	if baseName == "" {
		baseName = "Document"
	} else {
		baseName = strings.TrimSuffix(baseName, filepath.Ext(baseName))
	}

	var safePaths      []string
	var beautifulNames []string

	for _, p := range pagesArray {
		safePath      := filepath.Join(tempDir, fmt.Sprintf("%d.pdf", p))
		beautifulName := fmt.Sprintf("%s-page_%d.pdf", baseName, p)

		args := []string{req.InputPath, "--pages", ".", strconv.Itoa(p), "--", safePath}
		out, cmdErr := exec.Command("qpdf", args...).CombinedOutput()

		if _, statErr := os.Stat(safePath); statErr == nil {
			safePaths      = append(safePaths, safePath)
			beautifulNames = append(beautifulNames, beautifulName)
		} else {
			log.Error("Failed to extract page %d | statErr: %v | cmdErr: %v | Output: %s", p, statErr, cmdErr, string(out))
		}
	}

	if len(safePaths) == 0 {
		return domain.Response{Status: "error", Error: "Failed to extract any pages. Check range"}
	}

	for i, safePath := range safePaths {
		os.Rename(safePath, filepath.Join(tempDir, beautifulNames[i]))
	}

	zipOutputPath := utils.GetOutputPath(req.InputPath, "_splitted.zip")
	if err := utils.ZipDir(tempDir, zipOutputPath); err != nil {
		log.Error("Zip creation failed: %v", err)
		return domain.Response{Status: "error", Error: "Failed to create ZIP archive"}
	}

	if len(safePaths) <= 10 {
		outputDir := filepath.Dir(req.InputPath)
		var finalPaths []string

		for _, name := range beautifulNames {
			src := filepath.Join(tempDir, name)
			dst := filepath.Join(outputDir, name)
			if err := copyFile(src, dst); err != nil {
				log.Error("Failed to copy page file %s: %v", name, err)
				continue
			}
			finalPaths = append(finalPaths, dst)
		}

		if len(finalPaths) == 0 {
			return domain.Response{Status: "error", Error: "Failed to copy split pages"}
		}

		log.Info("Split %d pages: individual files + ZIP", len(safePaths))
		return domain.Response{Status: "ok", Paths: finalPaths, ZipPath: zipOutputPath}
	}

	log.Info("Split %d pages: ZIP only", len(safePaths))
	return domain.Response{Status: "ok", ZipPath: zipOutputPath}
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func NormalizePages(input string) string {
	for _, c := range []string{"(", ")", "[", "]"} {
		input = strings.ReplaceAll(input, c, "")
	}
	for old, new := range map[string]string{":": "-", "_": "-", " ": ",", ".": ",", ";": ","} {
		input = strings.ReplaceAll(input, old, new)
	}
	input = regexp.MustCompile(`,+`).ReplaceAllString(input, ",")
	input = regexp.MustCompile(`-+`).ReplaceAllString(input, "-")
	return strings.Trim(input, ",- ")
}

func parsePages(input string) ([]int, error) {
	input = NormalizePages(input)
	var pages []int

	for _, part := range strings.Split(input, ",") {
		if strings.Contains(part, "-") {
			bounds := strings.Split(part, "-")
			if len(bounds) == 2 {
				start, err1 := strconv.Atoi(bounds[0])
				end,   err2 := strconv.Atoi(bounds[1])
				if err1 == nil && err2 == nil && start <= end {
					for i := start; i <= end; i++ {
						pages = append(pages, i)
					}
				}
			}
		} else {
			if p, err := strconv.Atoi(part); err == nil {
				pages = append(pages, p)
			}
		}
	}
	return pages, nil
}

package ops

import (
	"fmt"
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

	// Извлекаем каждую страницу отдельно
	var safePaths     []string
	var beautifulNames []string

	for _, p := range pagesArray {
		safePath     := filepath.Join(tempDir, fmt.Sprintf("%d.pdf", p))
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

	// 1 страница — отказываем, смысла нет
	if len(safePaths) == 1 {
		return domain.Response{Status: "error", Error: "Cannot split: only 1 page selected. Please specify at least 2 pages."}
	}

	// Переименовываем в красивые имена для ZIP
	for i, safePath := range safePaths {
		os.Rename(safePath, filepath.Join(tempDir, beautifulNames[i]))
	}

	zipOutputPath := utils.GetOutputPath(req.InputPath, "_splitted.zip")
	if err := utils.ZipDir(tempDir, zipOutputPath); err != nil {
		log.Error("Zip creation failed: %v", err)
		return domain.Response{Status: "error", Error: "Failed to create ZIP archive"}
	}

	// 2-10 страниц — отдельные файлы + ZIP
	if len(safePaths) <= 10 {
		// Собираем пути после переименования
		var renamedPaths []string
		for _, name := range beautifulNames {
			renamedPaths = append(renamedPaths, filepath.Join(tempDir, name))
		}
		log.Info("Split %d pages: individual files + ZIP", len(safePaths))
		return domain.Response{Status: "ok", Paths: renamedPaths, ZipPath: zipOutputPath}
	}

	// 10+ страниц — только ZIP
	log.Info("Split %d pages: ZIP only", len(safePaths))
	return domain.Response{Status: "ok", ZipPath: zipOutputPath}
}

// NormalizePages — чистит пользовательский ввод диапазонов страниц
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

package utils

import (
	"os/exec"
	"path/filepath"
	"strings"
	"strconv"
)

func GetOutputPath(path string, suffix string) string {
	ext  := filepath.Ext(path)
	base := path[0 : len(path)-len(ext)]
	return base + suffix
}

func CleanError(output string) string {
	lower := strings.ToLower(output)
	if strings.Contains(lower, "unable to find page tree") || strings.Contains(lower, "no pages") {
		return "Zombie PDF: cant restore it"
	}
	if len(output) > 250 {
		return output[:250] + "..."
	}
	return output
}

func IsValidPdf(filePath string) bool {
	cmd         := exec.Command("pdfinfo", filePath)
	outputBytes, _ := cmd.CombinedOutput()
	output      := strings.ToLower(string(outputBytes))
	if strings.Contains(output, "pages:") {
		if strings.Contains(output, "pages:          0") || strings.Contains(output, "pages: 0") {
			return false
		}
		return true
	}
	return false
}

func GetPdfPageCount(path string) int {
	cmd    := exec.Command("pdfinfo", path)
	output, err := cmd.Output()
	if err != nil {
		return 0
	}
	for _, line := range strings.Split(string(output), "\n") {
		if strings.HasPrefix(line, "Pages:") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				n, _ := strconv.Atoi(parts[1])
				return n
			}
		}
	}
	return 0
}

package ops

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/logger"
	"pdf-worker/internal/service/utils"
)

func Repair(req domain.Request, log *logger.Logger) domain.Response {
	outputPath := utils.GetOutputPath(req.InputPath, "_repaired.pdf")

	origSize := int64(0)
	if fi, err := os.Stat(req.InputPath); err == nil {
		origSize = fi.Size()
	}
	log.Debug("\n[DEBUG] === START REPAIR: %s (Size: %d bytes) ===\n", filepath.Base(req.InputPath), origSize)

	// Проверяем результат инструмента — файл должен существовать, иметь размер и содержать страницы
	isOk := func(path, tool string) bool {
		fi, err := os.Stat(path)
		if err != nil || fi.Size() == 0 {
			log.Debug("[DEBUG] ❌ %s FAILED: File missing or 0 bytes.\n", tool)
			return false
		}
		log.Debug("[DEBUG] 🟢 %s created file. Size: %d bytes.\n", tool, fi.Size())

		if origSize > 1_000_000 && fi.Size() < 10_000 {
			log.Debug("[DEBUG] ❌ %s FAILED: File is a dummy wrapper (<10KB).\n", tool)
			return false
		}

		out, _ := exec.Command("pdfinfo", path).CombinedOutput()
		outStr  := strings.ToLower(string(out))
		log.Debug("[DEBUG] 🔎 %s pdfinfo output:\n%s\n", tool, outStr)

		if strings.Contains(outStr, "pages:") {
			if strings.Contains(outStr, "pages:          0") || strings.Contains(outStr, "pages: 0") {
				log.Debug("[DEBUG] ❌ %s FAILED: pdfinfo reports 0 pages.\n", tool)
				return false
			}
			log.Debug("[DEBUG] ✅ %s SUCCESS: Valid PDF structure found.\n", tool)
			return true
		}

		log.Debug("[DEBUG] ❌ %s FAILED: pdfinfo could not find 'pages:' keyword.\n", tool)
		return false
	}

	type repairStep struct {
		tool string
		run  func()
	}

	steps := []repairStep{
		{"PDFTOCAIRO", func() { exec.Command("pdftocairo", "-pdf", req.InputPath, outputPath).Run() }},
		{"MUTOOL",     func() { exec.Command("mutool", "clean", req.InputPath, outputPath).Run() }},
		{"QPDF",       func() { exec.Command("qpdf", req.InputPath, outputPath).Run() }},
		{"GS",         func() { exec.Command("gs", "-o", outputPath, "-sDEVICE=pdfwrite", "-dPDFSETTINGS=/prepress", req.InputPath).Run() }},
	}

	for _, step := range steps {
		step.run()
		if isOk(outputPath, step.tool) {
			return domain.Response{Status: "ok", Path: outputPath}
		}
		os.Remove(outputPath)
	}

	log.Error("REPAIR COMPLETELY FAILED for %s\n", filepath.Base(req.InputPath))
	return domain.Response{Status: "error", Error: "File data is completely destroyed. Recovery is impossible."}
}

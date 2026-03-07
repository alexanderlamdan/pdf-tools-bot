package ops

import (
	"fmt"
	"os/exec"
	"path/filepath"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/logger"
	"pdf-worker/internal/service/utils"
)

func Compress(req domain.Request, log *logger.Logger) domain.Response {
	outputPath := utils.GetOutputPath(req.InputPath, "_opt.pdf")

	cmd := exec.Command("gs",
		"-sDEVICE=pdfwrite",
		"-dCompatibilityLevel=1.4",
		"-dPDFSETTINGS=/ebook",
		"-dNOPAUSE", "-dQUIET", "-dBATCH",
		fmt.Sprintf("-sOutputFile=%s", outputPath),
		req.InputPath,
	)

	if output, err := cmd.CombinedOutput(); err != nil {
		log.Error("Compress failed for %s: %s", filepath.Base(req.InputPath), utils.CleanError(string(output)))
		return domain.Response{Status: "error", Error: utils.CleanError(string(output))}
	}

	return domain.Response{Status: "ok", Path: outputPath}
}

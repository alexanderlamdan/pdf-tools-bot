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

var commonPasswords = []string{
	"123456", "12345", "12345678", "password", "123456789", "1234", "1234567", "111111",
	"123123", "000000", "admin", "secret", "pdf", "document", "user", "master",
}

func Encrypt(req domain.Request, log *logger.Logger) domain.Response {
	outputPath := utils.GetOutputPath(req.InputPath, "_enc.pdf")

	cmd := exec.Command("qpdf", "--encrypt", req.Password, req.Password, "256", "--", req.InputPath, outputPath)
	output, err := cmd.CombinedOutput()

	if err != nil {
		// qpdf иногда возвращает ошибку но файл создаёт — проверяем
		if fi, statErr := os.Stat(outputPath); statErr == nil && fi.Size() > 0 {
			return domain.Response{Status: "ok", Path: outputPath}
		}
		log.Error("Encrypt failed for %s: %s", filepath.Base(req.InputPath), utils.CleanError(string(output)))
		return domain.Response{Status: "error", Error: utils.CleanError(string(output))}
	}

	return domain.Response{Status: "ok", Path: outputPath}
}

func Decrypt(req domain.Request, log *logger.Logger) domain.Response {
	outputPath := utils.GetOutputPath(req.InputPath, "_dec.pdf")

	cmd := exec.Command("qpdf", "--decrypt", "--password="+req.Password, req.InputPath, outputPath)
	output, err := cmd.CombinedOutput()

	if err != nil {
		if strings.Contains(string(output), "invalid password") {
			return domain.Response{Status: "error", Error: "Wrong password"}
		}
		// qpdf иногда возвращает ошибку но файл создаёт — проверяем
		if fi, statErr := os.Stat(outputPath); statErr == nil && fi.Size() > 0 {
			return domain.Response{Status: "ok", Path: outputPath}
		}
		log.Error("Decrypt failed for %s: %s", filepath.Base(req.InputPath), utils.CleanError(string(output)))
		return domain.Response{Status: "error", Error: utils.CleanError(string(output))}
	}

	return domain.Response{Status: "ok", Path: outputPath}
}

func Crack(req domain.Request, log *logger.Logger) domain.Response {
	outputPath := utils.GetOutputPath(req.InputPath, "_cracked.pdf")

	for _, pwd := range commonPasswords {
		cmd := exec.Command("qpdf", "--decrypt", "--password="+pwd, req.InputPath, outputPath)
		if err := cmd.Run(); err == nil {
			log.Info("Successfully cracked password for %s", filepath.Base(req.InputPath))
			return domain.Response{Status: "ok", Path: outputPath, Info: pwd}
		}
	}

	log.Info("Failed to crack password for %s: Too strong", filepath.Base(req.InputPath))
	return domain.Response{Status: "error", Error: "Password is too strong"}
}

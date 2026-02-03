package service

import (
	"fmt"
	"os"

	"path/filepath"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/i18n"

	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
)

var commonPasswords = []string{

	"123456", "12345", "12345678", "password", "123456789", "1234", "1234567", "111111",
	"123123", "000000", "admin", "secret", "pdf", "document", "user", "master",
}

type PdfService struct{}

func NewPdfService() *PdfService {

	return &PdfService{}

}

func (s *PdfService) GetInfo(req domain.Request) domain.Response {

	resp := domain.Response{Status: "ok"}

	ctx, err := api.ReadContextFile(req.InputPath)

	if err != nil {

		resp.Info = fmt.Sprintf("⚠️ %s (Protected PDF)", i18n.T(req.Lang, "enc"))
		return resp

	}

	fi, _ := os.Stat(req.InputPath)
	sizeMB := float64(fi.Size()) / (1024 * 1024)

	resp.Info = fmt.Sprintf(
		"PDF v%s\n%s: %d\n%s: %s\n%s: %.2f MB",
		ctx.HeaderVersion.String(),
		i18n.T(req.Lang, "pages"), ctx.PageCount,
		i18n.T(req.Lang, "author"), ctx.Author,
		i18n.T(req.Lang, "size"), sizeMB,
	)

	return resp

}

func (s *PdfService) Encrypt(req domain.Request) domain.Response {

	outputPath := getOutputPath(req.InputPath)

	conf := model.NewAESConfiguration(req.Password, req.Password, 256)
	err := api.EncryptFile(req.InputPath, outputPath, conf)

	if err != nil {

		return domain.Response{Status: "error", Error: err.Error()}

	}

	return domain.Response{Status: "ok", Path: outputPath}

}

func (s *PdfService) Decrypt(req domain.Request) domain.Response {

	outputPath := getOutputPath(req.InputPath)
	conf := model.NewAESConfiguration(req.Password, req.Password, 256)

	err := api.DecryptFile(req.InputPath, outputPath, conf)

	if err != nil {

		return domain.Response{Status: "error", Error: "Wrong password or file error"}

	}

	return domain.Response{Status: "ok", Path: outputPath}

}

func (s *PdfService) Crack(req domain.Request) domain.Response {

	outputPath := getOutputPath(req.InputPath)

	for _, pwd := range commonPasswords {

		conf := model.NewAESConfiguration(pwd, pwd, 256)
		f, err := os.Open(req.InputPath)

		if err != nil {

			continue

		}

		_, err = api.ReadContext(f, conf)
		f.Close()
		if err == nil {

			err := api.DecryptFile(req.InputPath, outputPath, conf)
			if err != nil {

				return domain.Response{Status: "error", Error: "Password found but decryption failed"}

			}

			return domain.Response{
				Status: "ok",
				Path:   outputPath,
				Info:   pwd,
			}

		}

	}

	return domain.Response{Status: "error", Error: "Password is too strong. Dictionary attack failed"}

}

func (s *PdfService) Optimize(req domain.Request) domain.Response {

	outputPath := getOutputPath(req.InputPath)

	err := api.OptimizeFile(req.InputPath, outputPath, nil)

	if err != nil {

		return domain.Response{Status: "error", Error: err.Error()}

	}

	return domain.Response{Status: "ok", Path: outputPath}

}

func getOutputPath(path string) string {

	ext := filepath.Ext(path)
	base := path[0 : len(path)-len(ext)]
	return base + "_mod" + ext

}

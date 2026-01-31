package service

import (
	"fmt"
	"os"

	// "path/filepath"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/i18n"
	// "github.com/pdfcpu/pdfcpu/pkg/api"
	// "github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
)

var commonPasswords = []string{

	"123456", "12345", "12345678", "password", "123456789", "1234", "1234567", "111111",
	"123123", "000000", "admin", "secret", "pdf", "document", "user", "master",
}

type PdfService struct{}

func newPdfService() *PdfService {

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
		"PDF v%s\n%s: %d\n%s: %.2f MB",
		ctx.HeaderVersion.String(),
		i18n.T(req.Lang, "pages"), ctx.PageCount,
		i18n.T(req.Lang, "author"), ctx.Author,
		i18n.T(req.Lang, "size"), sizeMB,
	)

	return resp

}

func (s *PdfService) Encrypt(req domain.Request) domain.Response {

}

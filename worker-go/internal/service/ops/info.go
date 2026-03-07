package ops

import (
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/logger"
)

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

func GetInfo(req domain.Request, log *logger.Logger) domain.Response {

	var size int64
	if fi, err := os.Stat(req.InputPath); err == nil {
		size = fi.Size()
	}

	info := PdfInfo{
		FileSize:    size,
		Author:      "No author",
		HasMetadata: true,
		CanSplit:    true,
		CanMerge:    true,
	}

	outputBytes, err := exec.Command("pdfinfo", req.InputPath).CombinedOutput()
	output      := string(outputBytes)
	lowerOutput := strings.ToLower(output)

	log.Debug("[DEBUG] pdfinfo output for %s:\n%s\n----------------\n", filepath.Base(req.InputPath), output)

	parsePdfInfoOutput(output, &info)

	isEncrypted := strings.Contains(lowerOutput, "incorrect password") ||
		strings.Contains(lowerOutput, "encrypted: yes") ||
		strings.Contains(lowerOutput, "password required")

	if err != nil {
		if isEncrypted {
			info.Encrypted      = true
			info.IsCorrupt      = false
			info.CantCompReason = "File is encrypted"
			return domain.Response{Status: "ok", Info: info}
		}
		info.IsCorrupt      = true
		info.CantCompReason = "File is corrupted or invalid"
		info.CanCompress    = false
		info.CanMerge       = false
		info.CanSplit       = false
		return domain.Response{Status: "ok", Info: info}
	}

	if !info.Encrypted {
		out, errText := exec.Command("pdftotext", "-l", "1", req.InputPath, "-").CombinedOutput()
		if errText == nil && len(strings.TrimSpace(string(out))) < 5 {
			info.IsScanned = true
		}
	}

	info.CanSplit    = true
	info.CanMerge    = true
	info.HasMetadata = true

	if info.IsScanned {
		info.CanCompress    = false
		info.CantCompReason = "Scanned documents(or images)"
	} else {
		info.CanCompress = true
	}

	return domain.Response{Status: "ok", Info: info}
}

func parsePdfInfoOutput(output string, info *PdfInfo) {
	for _, line := range strings.Split(output, "\n") {
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

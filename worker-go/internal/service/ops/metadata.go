package ops

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/logger"
	"pdf-worker/internal/service/utils"
)

type MetadataInfo struct {
	Fields              map[string]string `json:"fields"`
	HasWatermark        bool              `json:hasWatermark`
	HasDigitalSignature bool              `json:hasDigitalSignature`
}

func ReadMetadata(req domain.Request, log *logger.Logger) domain.Response {

	cmd := exec.Command("exiftool", "-json", "-Author", "-Creator", "-Producer", "-Title", "-Subject", "-Keywords", "-CreateDate", "-ModifyDate", "-XMPToolkit", "-Description", "-Copyright", "-Company", "-SourceModified", "-MetadataDate", req.InputPath)

	output, err := cmd.CombinedOutput()
	if err != nil && len(output) == 0 {

		log.Error("ReadMetadata failed for %s: %v", filepath.Base(req.InputPath), err)
		return domain.Response{Status: "error", Error: utils.CleanError(string(output))}

	}

	fields := parseExiftoolJSON(string(output))

	hasWatermark := detectWatermark(req.InputPath, log)
	hasDigitalSignature := detectDigitalSignature(req.InputPath, log)

	info := MetadataInfo{

		Fields:              fields,
		HasWatermark:        hasWatermark,
		HasDigitalSignature: hasDigitalSignature,
	}

	return domain.Response{Status: "ok", Info: info}

}

func WipeMetadata(req domain.Request, log *logger.Logger) domain.Response {

	mode := req.Password
	inputPath := req.InputPath
	outputPath := utils.GetOutputPath(inputPath, "_clean.pdf")

	step1 := utils.GetOutputPath(inputPath, "_step1.pdf")

	cmd := exec.Command("qpdf", "--linearize", "--remove-page-labels", inputPath, step1)
	if out, err := cmd.CombinedOutput(); err != nil {
		if fi, statErr := os.Stat(step1); statErr != nil || fi.Size() == 0 {
			log.Error("WipeMetadata qpdf step failed: %s", utils.CleanError(string(out)))
			return domain.Response{Status: "error", Error: utils.CleanError(string(out))}
		}
	}
	defer os.Remove(step1)

	if mode == "full_wipe" {
		step1gs := utils.GetOutputPath(inputPath, "_step1gs.pdf")
		cmdGs := exec.Command("gs",
			"-sDEVICE=pdfwrite",
			"-dCompatibilityLevel=1.4",
			"-dNOPAUSE", "-dQUIET", "-dBATCH",
			"-dFastWebView=false",
			fmt.Sprintf("-sOutputFile=%s", step1gs),
			step1,
		)
		if out, err := cmdGs.CombinedOutput(); err != nil || func() bool { fi, e := os.Stat(step1gs); return e != nil || fi.Size() == 0 }() {
			log.Error("WipeMetadata gs flatten failed: %s", utils.CleanError(string(out)))

		} else {
			os.Remove(step1)
			if err := os.Rename(step1gs, step1); err != nil {
				log.Error("WipeMetadata rename failed: %v", err)
			}
		}
	}

	var exifArgs []string
	if mode == "full_wipe" {

		exifArgs = []string{"-all=", "-overwrite_original", step1}
	} else {

		exifArgs = []string{
			"-Author=", "-Creator=", "-Producer=",
			"-Title=", "-Subject=", "-Keywords=",
			"-Description=", "-Copyright=", "-Company=",
			"-XMP:all=",
			"-overwrite_original",
			step1,
		}
	}

	cmdExif := exec.Command("exiftool", exifArgs...)
	if out, err := cmdExif.CombinedOutput(); err != nil {
		log.Error("WipeMetadata exiftool step failed: %s", string(out))

	}

	hasWatermark := detectWatermark(step1, log)

	if hasWatermark && mode == "full_wipe" {
		log.Info("Watermark detected in %s — running gs flatten", filepath.Base(inputPath))
		cmd := exec.Command("gs",
			"-sDEVICE=pdfwrite",
			"-dCompatibilityLevel=1.4",
			"-dPDFSETTINGS=/prepress",
			"-dNOPAUSE", "-dQUIET", "-dBATCH",
			"-dFastWebView=false",
			fmt.Sprintf("-sOutputFile=%s", outputPath),
			step1,
		)
		if out, err := cmd.CombinedOutput(); err != nil {
			log.Error("WipeMetadata gs step failed: %s", utils.CleanError(string(out)))
			if copyErr := copyFile(step1, outputPath); copyErr != nil {
				return domain.Response{Status: "error", Error: "Failed to produce output"}
			}
		}
	} else {
		if err := copyFile(step1, outputPath); err != nil {
			return domain.Response{Status: "error", Error: "Failed to produce output"}
		}
	}

	if fi, err := os.Stat(outputPath); err != nil || fi.Size() == 0 {
		return domain.Response{Status: "error", Error: "Output file is empty or missing"}
	}

	log.Info("WipeMetadata completed for %s (mode: %s, watermark: %v)", filepath.Base(inputPath), mode, hasWatermark)
	return domain.Response{Status: "ok", Path: outputPath}
}

func detectDigitalSignature(path string, log *logger.Logger) bool {

	cmd := exec.Command("qpdf", "--json", "--json-key=objects", path)
	output, err := cmd.CombinedOutput()
	if err != nil && len(output) == 0 {

		return false

	}

	lower := strings.ToLower(string(output))

	jsonMarkers := []string{
		"/sig",
		"/sigref",
		"/docmdp",
		"/byterange",
		"/sigflags",
		"etsi.",
		"adbe.",
		"pkcs",
		"comsign",
	}

	for _, marker := range jsonMarkers {

		if strings.Contains(lower, marker) {

			log.Info("Digital signature marker found in %s: %s", filepath.Base(path), marker)
			return true

		}

	}

	raw, err2 := os.ReadFile(path)
	if err2 == nil {
		lower2 := strings.ToLower(string(raw))
		strMarkers := []string{
			"/type /sig",
			"/ft /sig",
			"etsi.cades",
			"etsi.rfc3161",
			"adbe.pkcs7",
			"adobe.ppklite",
			"comsign",
			"comsigntrust",
			"/sigflags",
			"/byterange",
		}

		for _, marker := range strMarkers {
			if strings.Contains(lower2, marker) {
				log.Info("Digital signature marker found via strings in %s: %s", filepath.Base(path), marker)
				return true
			}
		}

	}

	return false

}

func detectWatermark(path string, log *logger.Logger) bool {

	cmd := exec.Command("qpdf", "--json", "--json-key=objects", path)
	output, err := cmd.CombinedOutput()

	if err != nil && len(output) == 0 {

		return false

	}

	lower := strings.ToLower(string(output))

	markers := []string{

		"/watermark",
		"/wm",
		"watermark",
		"/artifact",
		"/background",
	}

	for _, marker := range markers {

		if strings.Contains(lower, marker) {

			log.Info("Watermark marker found in %s: %s", filepath.Base(path), marker)
			return true
		}

	}

	return false

}

func parseExiftoolJSON(output string) map[string]string {

	fields := make(map[string]string)

	output = strings.TrimSpace(output)
	if !strings.HasPrefix(output, "[") {

		return fields

	}

	output = strings.TrimPrefix(output, "[")
	output = strings.TrimPrefix(output, "]")
	output = strings.TrimSpace(output)

	lines := strings.Split(output, "\n")
	for _, line := range lines {

		line = strings.TrimSpace(line)
		if !strings.Contains(line, ":") {

			continue

		}

		line = strings.TrimRight(line, ",")
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {

			continue

		}

		key := strings.Trim(strings.TrimSpace(parts[0]), `"`)
		value := strings.Trim(strings.TrimSpace(parts[1]), `"`)

		if key == "SourceFile" || key == "ExifToolVersion" || key == "FileSize" ||
			key == "FileType" || key == "MIMEType" || key == "PDFVersion" ||
			key == "Linearized" || key == "PageCount" || key == "FileModifyDate" ||
			key == "FileAccessDate" || key == "FileInodeChangeDate" || key == "FilePermissions" ||
			key == "Directory" || key == "FileName" {
			continue
		}

		if value != "" && value != "null" && value != "{" && value != "}" {

			fields[key] = value

		}

	}

	return fields

}

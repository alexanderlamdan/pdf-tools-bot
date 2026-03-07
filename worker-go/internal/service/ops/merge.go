package ops

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/logger"
	"pdf-worker/internal/service/utils"
)

// mergeFn — единый тип для всех merge-инструментов
type mergeFn func(inputPaths []string, outputPath string) error

var mergeTools = []mergeFn{
	mergeWithQpdf,
	mergeWithGhostscript,
	mergeWithPdftk,
	mergeWithPdfunite,
}

func Merge(req domain.Request, log *logger.Logger) domain.Response {
	if len(req.InputPaths) < 2 {
		return domain.Response{Status: "error", Error: "Need at least 2 files to merge"}
	}

	outputPath := utils.GetOutputPath(req.InputPaths[0], "_merged.pdf")

	for _, fn := range mergeTools {
		if err := fn(req.InputPaths, outputPath); err == nil {
			log.Info("Merge OK: %d files -> %s", len(req.InputPaths), filepath.Base(outputPath))
			return domain.Response{Status: "ok", Path: outputPath}
		} else {
			log.Error("Merge tool failed: %v", err)
		}
	}

	log.Error("All merge tools failed for %d files, switching to chunk fallback", len(req.InputPaths))
	return mergeChunkFallback(req.InputPaths, log)
}

// ── Merge tools ───────────────────────────────────────────────────────────────

func mergeWithQpdf(inputPaths []string, outputPath string) error {
	args := append([]string{"--empty", "--pages"}, inputPaths...)
	args  = append(args, "--", outputPath)
	out, err := exec.Command("qpdf", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("qpdf: %s", utils.CleanError(string(out)))
	}
	if _, statErr := os.Stat(outputPath); statErr != nil {
		return fmt.Errorf("qpdf: output file not created")
	}
	return nil
}

func mergeWithGhostscript(inputPaths []string, outputPath string) error {
	args := []string{
		"-dBATCH", "-dNOPAUSE", "-q",
		"-sDEVICE=pdfwrite",
		"-dCompatibilityLevel=1.4",
		fmt.Sprintf("-sOutputFile=%s", outputPath),
	}
	args  = append(args, inputPaths...)
	out, err := exec.Command("gs", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("gs: %s", utils.CleanError(string(out)))
	}
	if _, statErr := os.Stat(outputPath); statErr != nil {
		return fmt.Errorf("gs: output file not created")
	}
	return nil
}

func mergeWithPdftk(inputPaths []string, outputPath string) error {
	if _, err := exec.LookPath("pdftk"); err != nil {
		return fmt.Errorf("pdftk not installed")
	}
	args := append(inputPaths, "cat", "output", outputPath)
	out, err := exec.Command("pdftk", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("pdftk: %s", utils.CleanError(string(out)))
	}
	if _, statErr := os.Stat(outputPath); statErr != nil {
		return fmt.Errorf("pdftk: output file not created")
	}
	return nil
}

func mergeWithPdfunite(inputPaths []string, outputPath string) error {
	if _, err := exec.LookPath("pdfunite"); err != nil {
		return fmt.Errorf("pdfunite not installed")
	}
	args := append(inputPaths, outputPath)
	out, err := exec.Command("pdfunite", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("pdfunite: %s", utils.CleanError(string(out)))
	}
	if _, statErr := os.Stat(outputPath); statErr != nil {
		return fmt.Errorf("pdfunite: output file not created")
	}
	return nil
}

// ── Chunk fallback ────────────────────────────────────────────────────────────

type pageRef struct {
	file string
	page int
}

func mergeChunkFallback(inputPaths []string, log *logger.Logger) domain.Response {
	tempDir, err := os.MkdirTemp("", "merge_fallback_*")
	if err != nil {
		return domain.Response{Status: "error", Error: "Failed to create temp dir for fallback"}
	}
	defer os.RemoveAll(tempDir)

	// Собираем список всех страниц из всех файлов
	allPages := collectAllPages(inputPaths, log)
	if len(allPages) == 0 {
		return domain.Response{Status: "error", Error: "Could not read any pages from input files"}
	}

	chunkPaths := buildChunks(allPages, tempDir, log)
	if len(chunkPaths) == 0 {
		return domain.Response{Status: "error", Error: "Fallback also failed: cannot merge any chunk"}
	}

	zipOutputPath := utils.GetOutputPath(inputPaths[0], "_merged_parts.zip")
	if err := utils.ZipFiles(chunkPaths, zipOutputPath); err != nil {
		log.Error("mergeChunkFallback: zip failed: %v", err)
		// Отдаём чанки без ZIP
		return domain.Response{Status: "ok", Paths: chunkPaths, IsFallback: true}
	}

	log.Info("mergeChunkFallback: produced %d chunks, zip: %s", len(chunkPaths), filepath.Base(zipOutputPath))
	return domain.Response{Status: "ok", Paths: chunkPaths, ZipPath: zipOutputPath, IsFallback: true}
}

func collectAllPages(inputPaths []string, log *logger.Logger) []pageRef {
	var allPages []pageRef
	for _, f := range inputPaths {
		count := utils.GetPdfPageCount(f)
		if count <= 0 {
			log.Error("mergeChunkFallback: cannot get page count for %s, skipping", filepath.Base(f))
			continue
		}
		for p := 1; p <= count; p++ {
			allPages = append(allPages, pageRef{file: f, page: p})
		}
	}
	return allPages
}

func buildChunks(allPages []pageRef, tempDir string, log *logger.Logger) []string {
	const chunkSize  = 10
	totalChunks     := (len(allPages) + chunkSize - 1) / chunkSize
	var chunkPaths  []string

	for idx := 0; idx < totalChunks; idx++ {
		start := idx * chunkSize
		end   := start + chunkSize
		if end > len(allPages) {
			end = len(allPages)
		}

		chunkOutput := buildOneChunk(allPages[start:end], idx, start, end, tempDir, log)
		if chunkOutput != "" {
			chunkPaths = append(chunkPaths, chunkOutput)
			log.Info("mergeChunkFallback: chunk %d/%d OK (%d pages)", idx+1, totalChunks, end-start)
		} else {
			log.Error("mergeChunkFallback: chunk %d/%d FAILED", idx+1, totalChunks)
		}
	}

	return chunkPaths
}

func buildOneChunk(pages []pageRef, idx, globalStart, globalEnd int, tempDir string, log *logger.Logger) string {
	chunkTempDir, _ := os.MkdirTemp(tempDir, fmt.Sprintf("chunk_%d_*", idx))

	var singlePaths []string
	for pageIdx, ref := range pages {
		singlePath := filepath.Join(chunkTempDir, fmt.Sprintf("p%04d.pdf", pageIdx))
		args       := []string{ref.file, "--pages", ".", strconv.Itoa(ref.page), "--", singlePath}
		if _, err := exec.Command("qpdf", args...).CombinedOutput(); err == nil {
			singlePaths = append(singlePaths, singlePath)
		}
	}

	if len(singlePaths) == 0 {
		return ""
	}

	chunkName   := fmt.Sprintf("part_%02d_pages_%d_%d.pdf", idx+1, globalStart+1, globalEnd)
	chunkOutput := filepath.Join(tempDir, chunkName)

	for _, fn := range mergeTools {
		if err := fn(singlePaths, chunkOutput); err == nil {
			return chunkOutput
		}
	}

	return ""
}

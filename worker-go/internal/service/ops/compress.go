package ops

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/logger"
	"pdf-worker/internal/service/utils"
)

const (
	compressTimeout = 10 * time.Minute
	compressThreads = 2
)

func Compress(req domain.Request, log *logger.Logger) domain.Response {

	outputPath := utils.GetOutputPath(req.InputPath, "_opt.pdf")

	ctx, cancel := context.WithTimeout(context.Background(), compressTimeout)

	defer cancel()

	cmd := exec.CommandContext(ctx, "gs",

		"-sDEVICE=pdfwrite", "-dCompatibiltyLevel=1.4", "-dPDFSETTINGS=/ebook",
		"-dNOPAUSE", "-dQUIET", "-dBATCH",
		fmt.Sprintf("-dNumRenderingThreads=%d", compressThreads),
		"-dCompressFonts=true", "-dSubsetFonts=true",
		"-dDetectDuplicateImages=true",
		"-dColorImageDownsampleType=/Bicubic",
		"-dColorImageResolution=150",
		"-dGrayImageDownsampleType=/Bicubic",
		"-dGrayImageResolution=150",
		"-dMonoImageDownsampleType=/Subsample",
		"-dMonoImageResolution=150",
		fmt.Sprintf("-sOutputFile=%s", outputPath),
		req.InputPath,
	)

	log.Info("Compress started for %s (timeout: %s, threads: %d)", filepath.Base(req.InputPath), compressTimeout, compressThreads)

	start := time.Now()
	output, err := cmd.CombinedOutput()
	elapsed := time.Since(start)

	if ctx.Err() == context.DeadlineExceeded {

		log.Error("Compress TIMEOUT after %s for %s - killing process", elapsed, filepath.Base(req.InputPath))

		os.Remove(outputPath)
		return domain.Response{Status: "timeout", Error: "compress_timeout"}

	}

	if err != nil {

		if fi, statErr := os.Stat(outputPath); statErr == nil && fi.Size() > 0 {

			log.Info("Compress completed with warnings in %s for %s", elapsed, filepath.Base(req.InputPath))
			return buildCompressResponse(req.InputPath, outputPath, log)

		}

		log.Error("Compress failed for %s: %s", filepath.Base(req.InputPath), utils.CleanError(string(output)))
		os.Remove(outputPath)
		return domain.Response{Status: "error", Error: utils.CleanError(string(output))}

	}

	log.Info("Compress completed in %s for %s", elapsed, filepath.Base(req.InputPath))
	return buildCompressResponse(req.InputPath, outputPath, log)

}

func buildCompressResponse(inputPath, outputPath string, log *logger.Logger) domain.Response {

	origStat, err1 := os.Stat(inputPath)
	compStat, err2 := os.Stat(outputPath)

	if err1 != nil || err2 != nil {

		return domain.Response{Status: "ok", Path: outputPath}

	}
	origSize := origStat.Size()
	compSize := compStat.Size()

	if compSize >= origSize {

		log.Info("Compress output (%d) >=  input (%d) - file already optimal, returning original", compSize, origSize)
		os.Remove(outputPath)
		return domain.Response{
			Status: "already_optimal",
			Path:   inputPath,
			Info:   map[string]int64{"originalSize": origSize, "compressedSize": compSize},
		}

	}

	saved := origSize - compSize
	savedPercent := float64(saved) / float64(origSize) * 100

	log.Info("Compress: %d -> %d bytes (saved %.1f%%)", origSize, compSize, savedPercent)

	return domain.Response{
		Status: "ok",
		Path:   outputPath,
		Info:   map[string]int64{"originalSize": origSize, "compressedSize": compSize, "savedBytes": saved},
	}

}

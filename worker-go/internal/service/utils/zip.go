package utils

import (
	"archive/zip"
	"io"
	"os"
	"path/filepath"
)

func AddFileToZip(archive *zip.Writer, filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	w, err := archive.Create(filepath.Base(filePath))
	if err != nil {
		return err
	}

	_, err = io.Copy(w, file)
	return err
}

func ZipDir(sourceDir, zipPath string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	archive := zip.NewWriter(zipFile)
	defer archive.Close()

	entries, err := os.ReadDir(sourceDir)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if err := AddFileToZip(archive, filepath.Join(sourceDir, entry.Name())); err != nil {
			return err
		}
	}
	return nil
}

func ZipFiles(filePaths []string, zipPath string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	archive := zip.NewWriter(zipFile)
	defer archive.Close()

	for _, fp := range filePaths {
		if err := AddFileToZip(archive, fp); err != nil {
			return err
		}
	}
	return nil
}

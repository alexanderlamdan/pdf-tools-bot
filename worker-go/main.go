package main

import (
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"pdf-worker/internal/handler"
	"pdf-worker/internal/logger"
	"pdf-worker/internal/service"
)

const socketPath = "/run/bots/pdf-worker.sock"

func main() {

	appLog := logger.NewLogger()
	appLog.Info("Starting Go PDF Worker")

	setupSocket(appLog)

	pdfService := service.NewPdfService(appLog)

	h := handler.NewHandler(pdfService, appLog)

	http.Handle("/process", h)

	appLog.Info("✅ Go worker running structured on: %s\n", socketPath)

	waitShutdown(appLog)

}
func setupSocket(appLog *logger.Logger) {

	if _, err := os.Stat(socketPath); err == nil {

		os.Remove(socketPath)

	}

	dir := filepath.Dir(socketPath)
	os.MkdirAll(dir, 0777)

	listener, err := net.Listen("unix", socketPath)

	if err != nil {
		appLog.Error("CRITICAL: Failed to  listen on socket: %v", err)
		log.Fatalf("CRITICAL: %v", err)

	}

	os.Chmod(socketPath, 0666)

	go func() {

		if err := http.Serve(listener, nil); err != nil {
			appLog.Error("HTTP server failed: %v", err)
			log.Fatal(err)

		}

	}()

}

func waitShutdown(appLog *logger.Logger) {

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	appLog.Info("Shutdown signal received. Stopping worker...")
	os.Remove(socketPath)
	os.Exit(0)

}

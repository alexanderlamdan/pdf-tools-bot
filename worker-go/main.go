package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"pdf-worker/internal/handler"
	"pdf-worker/internal/service"
)

const socketPath = "/run/bots/pdf-worker.sock"

func main() {

	setupSocket()

	pdfService := service.NewPdfService()

	h := handler.NewHandler(pdfService)

	http.Handle("/process", h)

	fmt.Printf("✅ Go worker running structured on: %s\n", socketPath)

	waitShutdown()

}
func setupSocket() {

	if _, err := os.Stat(socketPath); err == nil {

		os.Remove(socketPath)

	}

	dir := filepath.Dir(socketPath)
	os.MkdirAll(dir, 0777)

	listener, err := net.Listen("unix", socketPath)

	if err != nil {

		log.Fatalf("CRITICAL: %v", err)

	}

	os.Chmod(socketPath, 0666)

	go func() {

		if err := http.Serve(listener, nil); err != nil {

			log.Fatal(err)

		}

	}()

}

func waitShutdown() {

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	fmt.Println("\nStopping")
	os.Remove(socketPath)
	os.Exit(0)

}

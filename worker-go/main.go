package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/pdfcpu/pdfcpu/pkg/api"
)

// ВАЖНО: Этот путь должен совпадать с workerSocketPath в LocalConfig.ts
const socketPath = "/run/bots/pdf-worker.sock"

type Request struct {
	Action    string `json:"action"`
	InputPath string `json:"inputPath"`
}

type Response struct {
	Status string `json:"status"`
	Info   string `json:"info,omitempty"`
	Error  string `json:"error,omitempty"`
}

func main() {

	if _, err := os.Stat(socketPath); err == nil {
		if err := os.Remove(socketPath); err != nil {
			log.Fatalf("CRITICAL: Не могу удалить старый сокет: %v", err)
		}
	}

	dir := filepath.Dir(socketPath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {

		if err := os.MkdirAll(dir, 0777); err != nil {
			log.Fatalf("CRITICAL: Не могу создать директорию: %v", err)
		}
	}

	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		log.Fatalf("CRITICAL: Ошибка создания сокета: %v", err)
	}

	if err := os.Chmod(socketPath, 0666); err != nil {
		log.Printf("WARNING: Не удалось сменить права на сокет: %v", err)
	}

	fmt.Printf("✅ Go worker running on: %s\n", socketPath)

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		fmt.Println("\nStopping...")
		listener.Close()
		os.Remove(socketPath)
		os.Exit(0)
	}()

	http.HandleFunc("/process", handleRequest)
	if err := http.Serve(listener, nil); err != nil {
		log.Fatal(err)
	}
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	fmt.Printf("Action: %s | File: %s\n", req.Action, req.InputPath)

	resp := Response{Status: "ok"}

	switch req.Action {
	case "info":
		ctx, err := api.ReadContextFile(req.InputPath)
		if err != nil {
			resp.Status = "error"
			resp.Error = fmt.Sprintf("Error reading PDF: %v", err)
		} else {
			resp.Info = fmt.Sprintf(
				"PDF v%s\nPages: %d\nAuthor: %s\nSize: %.2f MB",
				ctx.HeaderVersion.String(),
				ctx.PageCount,
				ctx.Author,
				float64(getFileSize(req.InputPath))/(1024*1024),
			)
		}
	default:
		resp.Status = "error"
		resp.Error = "Unknown Action"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func getFileSize(path string) int64 {
	fi, err := os.Stat(path)
	if err != nil {
		return 0
	}
	return fi.Size()
}

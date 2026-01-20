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

var translations = map[string]map[string]string{

	"en": {

		"pages":  "Pages",
		"author": "Author",
		"size":   "Size",
	},

	"ru": {

		"pages":  "Страниц",
		"author": "Автор",
		"size":   "Размер",
	},

	"he": {

		"pages":  "עמודים",
		"author": "מחבר",
		"size":   "גודל",
	},
}

type Request struct {
	Action    string `json:"action"`
	InputPath string `json:"inputPath"`
	Lang      string `json:lang`
}

type Response struct {
	Status string `json:"status"`
	Info   string `json:"info,omitempty"`
	Error  string `json:"error,omitempty"`
}

func main() {
	api.DisableConfigDir()

	if _, err := os.Stat(socketPath); err == nil {
		if err := os.Remove(socketPath); err != nil {
			log.Fatalf("CRITICAL: cant delete old socket: %v", err)
		}
	}

	dir := filepath.Dir(socketPath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {

		if err := os.MkdirAll(dir, 0777); err != nil {
			log.Fatalf("CRITICAL: cant create new directory: %v", err)
		}
	}

	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		log.Fatalf("CRITICAL: error creating socket: %v", err)
	}

	if err := os.Chmod(socketPath, 0666); err != nil {
		log.Printf("WARNING: cant set permissions on socket: %v", err)
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

func t(lang, key string) string {

	if dict, ok := translations[lang]; ok {

		if val, ok := dict[key]; ok {

			return val

		}

	}

	return translations["en"][key]

}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Lang == "" {

		req.Lang = "en"

	}

	fmt.Printf("Action: %s | Lang: %s | File: %s\n", req.Action, req.Lang, req.InputPath)

	resp := Response{Status: "ok"}

	switch req.Action {
	case "info":
		ctx, err := api.ReadContextFile(req.InputPath)
		if err != nil {
			resp.Status = "error"
			resp.Error = fmt.Sprintf("Error reading PDF: %v", err)
		} else {
			resp.Info = fmt.Sprintf(
				"PDF: v%s\n%s: %d\n%s: %s\n%s: %.2f MB",
				ctx.HeaderVersion.String(),
				t(req.Lang, "pages"), ctx.PageCount,
				t(req.Lang, "author"), ctx.Author,
				t(req.Lang, "size"), float64(getFileSize(req.InputPath))/(1024*1024),
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

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

const socketPath = "./test.sock"

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

		if err := os.Remove(socketPath); err == nil {

			log.Fatalf("CRITICAL: Can't delete the old socket: %v", err)

		}

	}

	dir := filepath.Dir(socketPath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {

		os.MkdirAll(dir, 0755)

	}

	listener, err := net.Listen("unix", socketPath)
	if err != nil {

		log.Fatalf("CRITICAL: Error to create socket: %v", err)

	}

	if err := os.Chmod(socketPath, 0660); err != nil {

		log.Fatalf("CRITICAL: Can't set chmod 0660: %v", err)

	}

	fmt.Printf("Go worker is running on unix socket: %s\n", socketPath)

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {

		<-c
		fmt.Println("\n Getting stop signal. Deleting the socket")
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

	resp := Response{Status: "ok"}
	switch req.Action {

	case "info":
		// Читаем контекст файла
		ctx, err := api.ReadContextFile(req.InputPath)
		if err != nil {
			resp.Status = "error"
			resp.Error = fmt.Sprintf("Ошибка чтения PDF: %v", err)
		} else {
			// Сразу формируем строку, чтобы не бесить компилятор лишними переменными
			resp.Info = fmt.Sprintf(
				"PDF v%s\nСтраниц: %d\nАвтор: %s\nСоздатель: %s\nРазмер: %.2f MB",
				ctx.HeaderVersion.String(),
				ctx.PageCount,
				ctx.Author,
				ctx.Creator,
				float64(getFileSize(req.InputPath))/(1024*1024),
			)
		}
	default:
		resp.Status = "error"
		resp.Error = "Unknow Actions"

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

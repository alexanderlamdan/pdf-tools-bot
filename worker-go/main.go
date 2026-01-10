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
)

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

}

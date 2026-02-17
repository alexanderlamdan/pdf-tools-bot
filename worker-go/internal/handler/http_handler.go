package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/service"
)

type Handler struct {
	service *service.PdfService
}

func NewHandler(s *service.PdfService) *Handler {

	return &Handler{service: s}

}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	var req domain.Request

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {

		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return

	}

	if req.Lang == "" {
		req.Lang = "en"
	}

	fmt.Printf("Action: %s | Lang: %s\n", req.Action, req.Lang)

	var resp domain.Response

	switch req.Action {

	case "info":
		resp = h.service.GetInfo(req)
	case "encrypt":
		resp = h.service.Encrypt(req)
	case "decrypt":
		resp = h.service.Decrypt(req)
	case "crack":
		resp = h.service.Crack(req)
	case "compress":
		resp = h.service.Compress(req)
	default:
		resp = domain.Response{Status: "error", Error: "Unknown action"}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)

}

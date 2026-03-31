package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"pdf-worker/internal/domain"
	"pdf-worker/internal/logger"
	"pdf-worker/internal/service"
)

type Handler struct {
	service *service.PdfService
	log     *logger.Logger
}

func NewHandler(s *service.PdfService, l *logger.Logger) *Handler {
	return &Handler{service: s, log: l}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req domain.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.log.Error("Invalid JSON received: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Lang == "" {
		req.Lang = "en"
	}

	h.log.Info("Request received | Action: %s | Lang: %s\n", req.Action, req.Lang)

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
	case "repair":
		resp = h.service.Repair(req)
	case "merge":
		resp = h.service.Merge(req)
	case "split":
		resp = h.service.Split(req)
	case "read_metadata":
		resp = h.service.ReadMetadata(req)
	case "wipe_metadata":
		resp = h.service.WipeMetadata(req)
	default:
		h.log.Error("Unknown action requested: %s", req.Action)
		resp = domain.Response{Status: "error", Error: "Unknown action"}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
	h.log.Debug("Request completed in %s | Action: %s | Status: %s", time.Since(start), req.Action, resp.Status)
}

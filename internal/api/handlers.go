package api

import (
	"encoding/json"
	"net/http"

	"github.com/Insulince/center-of-hash/internal/store"
)

type Handler struct {
	store *store.Store
}

func New(s *store.Store) *Handler {
	return &Handler{store: s}
}

func (h *Handler) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/snapshots", h.cors(h.snapshots))
	mux.HandleFunc("GET /api/snapshots/latest", h.cors(h.latest))
	// Handle preflight for both routes.
	mux.HandleFunc("OPTIONS /api/snapshots", h.cors(noContent))
	mux.HandleFunc("OPTIONS /api/snapshots/latest", h.cors(noContent))
}

func (h *Handler) snapshots(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, h.store.All())
}

func (h *Handler) latest(w http.ResponseWriter, r *http.Request) {
	snap, ok := h.store.Latest()
	if !ok {
		http.Error(w, "no data yet", http.StatusServiceUnavailable)
		return
	}
	writeJSON(w, snap)
}

func (h *Handler) cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		next(w, r)
	}
}

func noContent(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

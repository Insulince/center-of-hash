package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Insulince/center-of-hash/internal/api"
	"github.com/Insulince/center-of-hash/internal/builder"
	"github.com/Insulince/center-of-hash/internal/ccaf"
	"github.com/Insulince/center-of-hash/internal/store"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	shares, err := ccaf.Fetch()
	if err != nil {
		log.Fatalf("load ccaf data: %v", err)
	}
	s := store.New()
	s.Set(builder.Build(shares))
	log.Printf("loaded %d snapshots", len(s.All()))

	mux := http.NewServeMux()
	h := api.New(s)
	h.Routes(mux)

	if _, err := os.Stat("frontend/dist"); err == nil {
		mux.Handle("/", http.FileServer(http.Dir("frontend/dist")))
	}

	addr := fmt.Sprintf(":%s", port)
	log.Printf("listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

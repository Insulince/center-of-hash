package store

import (
	"sync"
	"time"
)

// CountryShare is one country's hashrate share for one month.
type CountryShare struct {
	Country string  `json:"country"` // ISO code
	Share   float64 `json:"share"`   // fraction 0–1
}

// Centroid is the hashrate-weighted center in ECEF meters.
type Centroid struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

// Snapshot is one historical data point: a date, the country distribution, and the centroid.
type Snapshot struct {
	Date     time.Time      `json:"date"`
	Shares   []CountryShare `json:"shares"`
	Centroid Centroid       `json:"centroid"`
}

// Store is a thread-safe in-memory cache of snapshots.
type Store struct {
	mu        sync.RWMutex
	snapshots []Snapshot
}

func New() *Store {
	return &Store{}
}

func (s *Store) Set(snapshots []Snapshot) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.snapshots = snapshots
}

func (s *Store) All() []Snapshot {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]Snapshot, len(s.snapshots))
	copy(out, s.snapshots)
	return out
}

func (s *Store) Latest() (Snapshot, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if len(s.snapshots) == 0 {
		return Snapshot{}, false
	}
	return s.snapshots[len(s.snapshots)-1], true
}

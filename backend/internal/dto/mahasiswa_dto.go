package dto

import "time"

// ─── Request DTOs ────────────────────────────────────────────────────────────

type CreateMahasiswaRequest struct {
	UserID    *uint64 `json:"user_id"`
	NIM       string  `json:"nim"      validate:"required,min=5,max=20"`
	Nama      string  `json:"nama"     validate:"required,min=3,max=255"`
	Email     string  `json:"email"    validate:"required,email"`
	Jurusan   string  `json:"jurusan"  validate:"required,min=3,max=255"`
	Semester  int     `json:"semester" validate:"required,min=1,max=14"`
	DosenPAID *uint64 `json:"dosen_pa_id"`
}

type UpdateMahasiswaRequest struct {
	NIM       string  `json:"nim"      validate:"omitempty,min=5,max=20"`
	Nama      string  `json:"nama"     validate:"omitempty,min=3,max=255"`
	Email     string  `json:"email"    validate:"omitempty,email"`
	Jurusan   string  `json:"jurusan"  validate:"omitempty,min=3,max=255"`
	Semester  int     `json:"semester" validate:"omitempty,min=1,max=14"`
	DosenPAID *uint64 `json:"dosen_pa_id"`
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

type MahasiswaResponse struct {
	ID          uint64    `json:"id"`
	UserID      *uint64   `json:"user_id,omitempty"`
	NIM         string    `json:"nim"`
	Nama        string    `json:"nama"`
	Email       string    `json:"email"`
	Jurusan     string    `json:"jurusan"`
	Semester    int       `json:"semester"`
	DosenPAID   *uint64   `json:"dosen_pa_id,omitempty"`
	DosenPANama string    `json:"dosen_pa_nama,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

package dto

import "time"

// ─── Request DTOs ────────────────────────────────────────────────────────────

type CreateDosenRequest struct {
	UserID *uint64 `json:"user_id"`
	NIDN   string  `json:"nidn"  validate:"required,min=5,max=20"`
	Nama   string  `json:"nama"  validate:"required,min=3,max=255"`
	Email  string  `json:"email" validate:"required,email"`
	Prodi  string  `json:"prodi" validate:"required,min=3,max=255"`
}

type UpdateDosenRequest struct {
	NIDN  string `json:"nidn"  validate:"omitempty,min=5,max=20"`
	Nama  string `json:"nama"  validate:"omitempty,min=3,max=255"`
	Email string `json:"email" validate:"omitempty,email"`
	Prodi string `json:"prodi" validate:"omitempty,min=3,max=255"`
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

type DosenResponse struct {
	ID        uint64    `json:"id"`
	UserID    *uint64   `json:"user_id,omitempty"`
	NIDN      string    `json:"nidn"`
	Nama      string    `json:"nama"`
	Email     string    `json:"email"`
	Prodi     string    `json:"prodi"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type DosenDetailResponse struct {
	DosenResponse
	JumlahMahasiswa int                  `json:"jumlah_mahasiswa"`
	Mahasiswa       []*MahasiswaResponse `json:"mahasiswa,omitempty"`
}

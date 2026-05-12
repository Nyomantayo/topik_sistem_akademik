package domain

import "time"

type Mahasiswa struct {
	ID          uint64    `db:"id"             json:"id"`
	UserID      *uint64   `db:"user_id"        json:"user_id,omitempty"`
	NIM         string    `db:"nim"            json:"nim"`
	Nama        string    `db:"nama"           json:"nama"`
	Email       string    `db:"email"          json:"email"`
	Jurusan     string    `db:"jurusan"        json:"jurusan"`
	Semester    int       `db:"semester"       json:"semester"`
	DosenPAID   *uint64   `db:"dosen_pa_id"    json:"dosen_pa_id,omitempty"`
	DosenPANama string    `db:"dosen_pa_nama"  json:"dosen_pa_nama,omitempty"`
	CreatedAt   time.Time `db:"created_at"     json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"     json:"updated_at"`
}

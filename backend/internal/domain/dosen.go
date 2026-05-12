package domain

import "time"

type Dosen struct {
	ID        uint64    `db:"id"         json:"id"`
	UserID    *uint64   `db:"user_id"    json:"user_id,omitempty"`
	NIDN      string    `db:"nidn"       json:"nidn"`
	Nama      string    `db:"nama"       json:"nama"`
	Email     string    `db:"email"      json:"email"`
	Prodi     string    `db:"prodi"      json:"prodi"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

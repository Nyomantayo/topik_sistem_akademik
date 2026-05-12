package migrations

import (
	_ "embed"
	"log"
	"strings"

	"github.com/jmoiron/sqlx"
)

//go:embed 001_init.sql
var initSQL string

// RunMigration menjalankan migrasi database secara otomatis saat aplikasi start.
// Statement CREATE DATABASE dan USE akan di-skip karena koneksi DB sudah
// terhubung ke database yang benar melalui DSN.
// Semua statement menggunakan IF NOT EXISTS / INSERT IGNORE sehingga aman
// dijalankan berulang kali (idempotent).
func RunMigration(db *sqlx.DB) {
	// Pisahkan SQL menjadi statement-statement individual berdasarkan semicolon
	statements := strings.Split(initSQL, ";")
	executed := 0

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}

		// Cek apakah statement ini hanya berisi komentar (tidak ada kode SQL)
		lines := strings.Split(stmt, "\n")
		hasCode := false
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if trimmed != "" && !strings.HasPrefix(trimmed, "--") {
				hasCode = true
				break
			}
		}
		if !hasCode {
			continue
		}

		// Ambil isi statement tanpa komentar untuk pengecekan
		upper := strings.ToUpper(strings.TrimSpace(stmt))
		for strings.HasPrefix(upper, "--") {
			idx := strings.Index(upper, "\n")
			if idx == -1 {
				upper = ""
				break
			}
			upper = strings.TrimSpace(upper[idx+1:])
		}

		// Skip CREATE DATABASE dan USE — Railway/platform sudah menyediakan DB
		if strings.HasPrefix(upper, "CREATE DATABASE") || strings.HasPrefix(upper, "USE ") {
			continue
		}

		if _, err := db.Exec(stmt); err != nil {
			// Log warning tapi jangan fatal — INSERT IGNORE mungkin skip duplicates
			log.Printf("⚠️  Migration warning: %v", err)
		} else {
			executed++
		}
	}

	log.Printf("✅ Database migration selesai (%d statements executed)", executed)
}

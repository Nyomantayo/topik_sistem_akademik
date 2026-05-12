package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"

	"topsus-krs/internal/domain"
	"topsus-krs/pkg/pagination"
)

// MahasiswaRepository mendefinisikan kontrak operasi database untuk entitas Mahasiswa
type MahasiswaRepository interface {
	Create(ctx context.Context, m *domain.Mahasiswa) error
	FindAll(ctx context.Context, params *pagination.Params) ([]*domain.Mahasiswa, int64, error)
	FindByID(ctx context.Context, id uint64) (*domain.Mahasiswa, error)
	FindByNIM(ctx context.Context, nim string) (*domain.Mahasiswa, error)
	FindByEmail(ctx context.Context, email string) (*domain.Mahasiswa, error)
	FindByUserID(ctx context.Context, userID uint64) (*domain.Mahasiswa, error)
	FindByDosenPA(ctx context.Context, dosenID uint64, params *pagination.Params) ([]*domain.Mahasiswa, int64, error)
	Update(ctx context.Context, m *domain.Mahasiswa) error
	Delete(ctx context.Context, id uint64) error
	CountByJurusan(ctx context.Context) ([]map[string]interface{}, error)
	CountTotal(ctx context.Context) (int64, error)
}

type mahasiswaRepository struct {
	db *sqlx.DB
}

func NewMahasiswaRepository(db *sqlx.DB) MahasiswaRepository {
	return &mahasiswaRepository{db: db}
}

// baseSelectQuery adalah SELECT dengan JOIN ke tabel dosen untuk mendapatkan nama dosen PA
const baseSelectQuery = `
	SELECT
		m.id, m.user_id, m.nim, m.nama, m.email, m.jurusan,
		m.semester, m.dosen_pa_id, m.created_at, m.updated_at,
		COALESCE(d.nama, '') AS dosen_pa_nama
	FROM mahasiswa m
	LEFT JOIN dosen d ON m.dosen_pa_id = d.id
`

func (r *mahasiswaRepository) Create(ctx context.Context, m *domain.Mahasiswa) error {
	query := `
		INSERT INTO mahasiswa (user_id, nim, nama, email, jurusan, semester, dosen_pa_id)
		VALUES (:user_id, :nim, :nama, :email, :jurusan, :semester, :dosen_pa_id)
	`
	result, err := r.db.NamedExecContext(ctx, query, m)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	m.ID = uint64(id)
	return nil
}

func (r *mahasiswaRepository) FindAll(ctx context.Context, params *pagination.Params) ([]*domain.Mahasiswa, int64, error) {
	var mahasiswas []*domain.Mahasiswa
	var total int64

	whereClause := ""
	args := []interface{}{}

	if params.Search != "" {
		whereClause = "WHERE (m.nama LIKE ? OR m.nim LIKE ? OR m.email LIKE ? OR m.jurusan LIKE ?)"
		searchTerm := fmt.Sprintf("%%%s%%", params.Search)
		args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM mahasiswa m %s", whereClause)
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(
		"%s %s ORDER BY m.created_at DESC LIMIT ? OFFSET ?",
		baseSelectQuery, whereClause,
	)
	args = append(args, params.Limit, params.Offset)

	if err := r.db.SelectContext(ctx, &mahasiswas, query, args...); err != nil {
		return nil, 0, err
	}

	return mahasiswas, total, nil
}

func (r *mahasiswaRepository) FindByID(ctx context.Context, id uint64) (*domain.Mahasiswa, error) {
	var m domain.Mahasiswa
	query := fmt.Sprintf("%s WHERE m.id = ? LIMIT 1", baseSelectQuery)
	err := r.db.GetContext(ctx, &m, query, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &m, err
}

func (r *mahasiswaRepository) FindByUserID(ctx context.Context, userID uint64) (*domain.Mahasiswa, error) {
	var m domain.Mahasiswa
	query := fmt.Sprintf("%s WHERE m.user_id = ? LIMIT 1", baseSelectQuery)
	err := r.db.GetContext(ctx, &m, query, userID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &m, err
}

func (r *mahasiswaRepository) FindByNIM(ctx context.Context, nim string) (*domain.Mahasiswa, error) {
	var m domain.Mahasiswa
	query := fmt.Sprintf("%s WHERE m.nim = ? LIMIT 1", baseSelectQuery)
	err := r.db.GetContext(ctx, &m, query, nim)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &m, err
}

func (r *mahasiswaRepository) FindByEmail(ctx context.Context, email string) (*domain.Mahasiswa, error) {
	var m domain.Mahasiswa
	query := fmt.Sprintf("%s WHERE m.email = ? LIMIT 1", baseSelectQuery)
	err := r.db.GetContext(ctx, &m, query, email)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &m, err
}

func (r *mahasiswaRepository) FindByDosenPA(ctx context.Context, dosenID uint64, params *pagination.Params) ([]*domain.Mahasiswa, int64, error) {
	var mahasiswas []*domain.Mahasiswa
	var total int64

	args := []interface{}{dosenID}
	searchClause := ""
	if params.Search != "" {
		searchClause = "AND (m.nama LIKE ? OR m.nim LIKE ? OR m.email LIKE ?)"
		searchTerm := fmt.Sprintf("%%%s%%", params.Search)
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	countQuery := fmt.Sprintf(
		"SELECT COUNT(*) FROM mahasiswa m WHERE m.dosen_pa_id = ? %s",
		searchClause,
	)
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(
		"%s WHERE m.dosen_pa_id = ? %s ORDER BY m.nama ASC LIMIT ? OFFSET ?",
		baseSelectQuery, searchClause,
	)
	args = append(args, params.Limit, params.Offset)

	if err := r.db.SelectContext(ctx, &mahasiswas, query, args...); err != nil {
		return nil, 0, err
	}

	return mahasiswas, total, nil
}

func (r *mahasiswaRepository) Update(ctx context.Context, m *domain.Mahasiswa) error {
	query := `
		UPDATE mahasiswa
		SET nim = :nim, nama = :nama, email = :email, jurusan = :jurusan,
		    semester = :semester, dosen_pa_id = :dosen_pa_id, updated_at = NOW()
		WHERE id = :id
	`
	_, err := r.db.NamedExecContext(ctx, query, m)
	return err
}

func (r *mahasiswaRepository) Delete(ctx context.Context, id uint64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM mahasiswa WHERE id = ?`, id)
	return err
}

func (r *mahasiswaRepository) CountByJurusan(ctx context.Context) ([]map[string]interface{}, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT jurusan, COUNT(*) as count
		FROM mahasiswa
		GROUP BY jurusan
		ORDER BY count DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var jurusan string
		var count int64
		if err := rows.Scan(&jurusan, &count); err != nil {
			return nil, err
		}
		result = append(result, map[string]interface{}{
			"jurusan": jurusan,
			"count":   count,
		})
	}
	return result, nil
}

func (r *mahasiswaRepository) CountTotal(ctx context.Context) (int64, error) {
	var total int64
	err := r.db.GetContext(ctx, &total, `SELECT COUNT(*) FROM mahasiswa`)
	return total, err
}

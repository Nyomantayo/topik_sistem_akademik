package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"

	"topsus-krs/internal/domain"
	"topsus-krs/pkg/pagination"
)

// DosenRepository mendefinisikan kontrak operasi database untuk entitas Dosen
type DosenRepository interface {
	Create(ctx context.Context, d *domain.Dosen) error
	FindAll(ctx context.Context, params *pagination.Params) ([]*domain.Dosen, int64, error)
	FindByID(ctx context.Context, id uint64) (*domain.Dosen, error)
	FindByNIDN(ctx context.Context, nidn string) (*domain.Dosen, error)
	FindByEmail(ctx context.Context, email string) (*domain.Dosen, error)
	FindByUserID(ctx context.Context, userID uint64) (*domain.Dosen, error)
	Update(ctx context.Context, d *domain.Dosen) error
	Delete(ctx context.Context, id uint64) error
	CountByProdi(ctx context.Context) ([]map[string]interface{}, error)
	CountTotal(ctx context.Context) (int64, error)
}

type dosenRepository struct {
	db *sqlx.DB
}

func NewDosenRepository(db *sqlx.DB) DosenRepository {
	return &dosenRepository{db: db}
}

func (r *dosenRepository) Create(ctx context.Context, d *domain.Dosen) error {
	query := `
		INSERT INTO dosen (user_id, nidn, nama, email, prodi)
		VALUES (:user_id, :nidn, :nama, :email, :prodi)
	`
	result, err := r.db.NamedExecContext(ctx, query, d)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	d.ID = uint64(id)
	return nil
}

func (r *dosenRepository) FindAll(ctx context.Context, params *pagination.Params) ([]*domain.Dosen, int64, error) {
	var dosen []*domain.Dosen
	var total int64

	whereClause := ""
	args := []interface{}{}

	if params.Search != "" {
		whereClause = "WHERE (nama LIKE ? OR nidn LIKE ? OR email LIKE ? OR prodi LIKE ?)"
		searchTerm := fmt.Sprintf("%%%s%%", params.Search)
		args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM dosen %s", whereClause)
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(
		"SELECT * FROM dosen %s ORDER BY created_at DESC LIMIT ? OFFSET ?",
		whereClause,
	)
	args = append(args, params.Limit, params.Offset)

	if err := r.db.SelectContext(ctx, &dosen, query, args...); err != nil {
		return nil, 0, err
	}

	return dosen, total, nil
}

func (r *dosenRepository) FindByID(ctx context.Context, id uint64) (*domain.Dosen, error) {
	var d domain.Dosen
	query := `SELECT * FROM dosen WHERE id = ? LIMIT 1`
	err := r.db.GetContext(ctx, &d, query, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &d, err
}

func (r *dosenRepository) FindByNIDN(ctx context.Context, nidn string) (*domain.Dosen, error) {
	var d domain.Dosen
	query := `SELECT * FROM dosen WHERE nidn = ? LIMIT 1`
	err := r.db.GetContext(ctx, &d, query, nidn)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &d, err
}

func (r *dosenRepository) FindByEmail(ctx context.Context, email string) (*domain.Dosen, error) {
	var d domain.Dosen
	query := `SELECT * FROM dosen WHERE email = ? LIMIT 1`
	err := r.db.GetContext(ctx, &d, query, email)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &d, err
}

func (r *dosenRepository) FindByUserID(ctx context.Context, userID uint64) (*domain.Dosen, error) {
	var d domain.Dosen
	query := `SELECT * FROM dosen WHERE user_id = ? LIMIT 1`
	err := r.db.GetContext(ctx, &d, query, userID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &d, err
}

func (r *dosenRepository) Update(ctx context.Context, d *domain.Dosen) error {
	query := `
		UPDATE dosen
		SET nidn = :nidn, nama = :nama, email = :email, prodi = :prodi, updated_at = NOW()
		WHERE id = :id
	`
	_, err := r.db.NamedExecContext(ctx, query, d)
	return err
}

func (r *dosenRepository) Delete(ctx context.Context, id uint64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM dosen WHERE id = ?`, id)
	return err
}

func (r *dosenRepository) CountByProdi(ctx context.Context) ([]map[string]interface{}, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT prodi, COUNT(*) as count
		FROM dosen
		GROUP BY prodi
		ORDER BY count DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var prodi string
		var count int64
		if err := rows.Scan(&prodi, &count); err != nil {
			return nil, err
		}
		result = append(result, map[string]interface{}{
			"prodi": prodi,
			"count": count,
		})
	}
	return result, nil
}

func (r *dosenRepository) CountTotal(ctx context.Context) (int64, error) {
	var total int64
	err := r.db.GetContext(ctx, &total, `SELECT COUNT(*) FROM dosen`)
	return total, err
}

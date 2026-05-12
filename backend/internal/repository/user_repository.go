package repository

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"

	"topsus-krs/internal/domain"
)

// UserRepository mendefinisikan kontrak operasi database untuk entitas User
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id uint64) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
}

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (name, email, password, role)
		VALUES (:name, :email, :password, :role)
	`
	result, err := r.db.NamedExecContext(ctx, query, user)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	user.ID = uint64(id)
	return nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	query := `SELECT * FROM users WHERE email = ? LIMIT 1`
	err := r.db.GetContext(ctx, &user, query, email)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &user, err
}

func (r *userRepository) FindByID(ctx context.Context, id uint64) (*domain.User, error) {
	var user domain.User
	query := `SELECT * FROM users WHERE id = ? LIMIT 1`
	err := r.db.GetContext(ctx, &user, query, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &user, err
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users
		SET name = :name, email = :email, password = :password, updated_at = NOW()
		WHERE id = :id
	`
	_, err := r.db.NamedExecContext(ctx, query, user)
	return err
}

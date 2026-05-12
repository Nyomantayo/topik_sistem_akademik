package dto

import "time"

// ─── Request DTOs ────────────────────────────────────────────────────────────

type RegisterRequest struct {
	Name     string `json:"name"     validate:"required,min=3,max=100"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Role     string `json:"role"     validate:"required,oneof=admin mahasiswa dosen"`
}

type LoginRequest struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type UpdateProfileRequest struct {
	Name string `json:"name" validate:"required,min=3,max=100"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

type AuthResponse struct {
	Token string      `json:"token"`
	User  UserProfile `json:"user"`
}

type UserProfile struct {
	ID        uint64    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

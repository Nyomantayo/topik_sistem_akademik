package service

import (
	"context"
	"errors"
	"time"

	"topsus-krs/internal/domain"
	"topsus-krs/internal/dto"
	"topsus-krs/internal/repository"
	"topsus-krs/utils"
)

// AuthService mendefinisikan kontrak business logic untuk autentikasi
type AuthService interface {
	Register(ctx context.Context, req *dto.RegisterRequest) (*dto.AuthResponse, error)
	Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error)
	GuestLogin(ctx context.Context) (*dto.AuthResponse, error)
	GetProfile(ctx context.Context, userID uint64) (*dto.UserProfile, error)
	UpdateProfile(ctx context.Context, userID uint64, req *dto.UpdateProfileRequest) (*dto.UserProfile, error)
	ChangePassword(ctx context.Context, userID uint64, req *dto.ChangePasswordRequest) error
}

type authService struct {
	userRepo   repository.UserRepository
	jwtSecret  string
	jwtExpiry  int
}

func NewAuthService(userRepo repository.UserRepository, jwtSecret string, jwtExpiry int) AuthService {
	return &authService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
		jwtExpiry: jwtExpiry,
	}
}

func (s *authService) Register(ctx context.Context, req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	existing, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email sudah terdaftar")
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     req.Role,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	token, err := utils.GenerateToken(user.ID, user.Email, user.Role, user.Name, s.jwtSecret, s.jwtExpiry)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User: dto.UserProfile{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		},
	}, nil
}

func (s *authService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("email atau password salah")
	}

	if !utils.CheckPassword(req.Password, user.Password) {
		return nil, errors.New("email atau password salah")
	}

	token, err := utils.GenerateToken(user.ID, user.Email, user.Role, user.Name, s.jwtSecret, s.jwtExpiry)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User: dto.UserProfile{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		},
	}, nil
}

func (s *authService) GuestLogin(ctx context.Context) (*dto.AuthResponse, error) {
	token, err := utils.GenerateToken(0, "guest@krs.ac.id", "guest", "Tamu", s.jwtSecret, 2)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	return &dto.AuthResponse{
		Token: token,
		User: dto.UserProfile{
			ID:        0,
			Name:      "Tamu",
			Email:     "guest@krs.ac.id",
			Role:      "guest",
			CreatedAt: now,
			UpdatedAt: now,
		},
	}, nil
}

func (s *authService) GetProfile(ctx context.Context, userID uint64) (*dto.UserProfile, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user tidak ditemukan")
	}

	return &dto.UserProfile{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}, nil
}

func (s *authService) UpdateProfile(ctx context.Context, userID uint64, req *dto.UpdateProfileRequest) (*dto.UserProfile, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user tidak ditemukan")
	}

	user.Name = req.Name
	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return &dto.UserProfile{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}, nil
}

func (s *authService) ChangePassword(ctx context.Context, userID uint64, req *dto.ChangePasswordRequest) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user tidak ditemukan")
	}

	if !utils.CheckPassword(req.OldPassword, user.Password) {
		return errors.New("password lama tidak sesuai")
	}

	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	user.Password = newHash
	return s.userRepo.Update(ctx, user)
}

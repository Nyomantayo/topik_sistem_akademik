package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"topsus-krs/internal/domain"
	"topsus-krs/internal/dto"
	"topsus-krs/internal/repository"
	"topsus-krs/pkg/cache"
	"topsus-krs/pkg/pagination"
)

// MahasiswaService mendefinisikan kontrak business logic untuk mahasiswa
type MahasiswaService interface {
	GetAll(ctx context.Context, params *pagination.Params) ([]*dto.MahasiswaResponse, int64, error)
	GetByID(ctx context.Context, id uint64) (*dto.MahasiswaResponse, error)
	GetMyProfile(ctx context.Context, userID uint64) (*dto.MahasiswaResponse, error)
	Create(ctx context.Context, req *dto.CreateMahasiswaRequest) (*dto.MahasiswaResponse, error)
	Update(ctx context.Context, id uint64, req *dto.UpdateMahasiswaRequest) (*dto.MahasiswaResponse, error)
	Delete(ctx context.Context, id uint64) error
}

type mahasiswaService struct {
	repo      repository.MahasiswaRepository
	dosenRepo repository.DosenRepository
	cache     *cache.RedisCache
}

func NewMahasiswaService(
	repo repository.MahasiswaRepository,
	dosenRepo repository.DosenRepository,
	redisCache *cache.RedisCache,
) MahasiswaService {
	return &mahasiswaService{
		repo:      repo,
		dosenRepo: dosenRepo,
		cache:     redisCache,
	}
}

func (s *mahasiswaService) GetAll(ctx context.Context, params *pagination.Params) ([]*dto.MahasiswaResponse, int64, error) {
	cacheKey := fmt.Sprintf("mahasiswa:list:p=%d:l=%d:q=%s", params.Page, params.Limit, params.Search)

	type cachedList struct {
		Items []*dto.MahasiswaResponse `json:"items"`
		Total int64                    `json:"total"`
	}

	var cached cachedList
	if err := s.cache.Get(ctx, cacheKey, &cached); err == nil {
		// cache hit
		return cached.Items, cached.Total, nil
	}

	// cache miss — ambil dari database
	mahasiswas, total, err := s.repo.FindAll(ctx, params)
	if err != nil {
		return nil, 0, err
	}

	items := make([]*dto.MahasiswaResponse, 0, len(mahasiswas))
	for _, m := range mahasiswas {
		items = append(items, mapMahasiswaToDTO(m))
	}

	// simpan ke cache selama 5 menit
	_ = s.cache.Set(ctx, cacheKey, cachedList{Items: items, Total: total}, 5*time.Minute)

	return items, total, nil
}

func (s *mahasiswaService) GetByID(ctx context.Context, id uint64) (*dto.MahasiswaResponse, error) {
	cacheKey := fmt.Sprintf("mahasiswa:%d", id)

	var cached dto.MahasiswaResponse
	if err := s.cache.Get(ctx, cacheKey, &cached); err == nil {
		return &cached, nil
	}

	m, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, errors.New("mahasiswa tidak ditemukan")
	}

	result := mapMahasiswaToDTO(m)
	_ = s.cache.Set(ctx, cacheKey, result, 10*time.Minute)

	return result, nil
}

func (s *mahasiswaService) GetMyProfile(ctx context.Context, userID uint64) (*dto.MahasiswaResponse, error) {
	m, err := s.repo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, errors.New("data mahasiswa tidak ditemukan untuk akun ini")
	}
	return mapMahasiswaToDTO(m), nil
}

func (s *mahasiswaService) Create(ctx context.Context, req *dto.CreateMahasiswaRequest) (*dto.MahasiswaResponse, error) {
	// Validasi NIM unik
	existing, err := s.repo.FindByNIM(ctx, req.NIM)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("NIM sudah terdaftar")
	}

	// Validasi email unik
	existingEmail, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existingEmail != nil {
		return nil, errors.New("email mahasiswa sudah terdaftar")
	}

	// Validasi dosen PA jika diberikan
	if req.DosenPAID != nil {
		dosen, err := s.dosenRepo.FindByID(ctx, *req.DosenPAID)
		if err != nil {
			return nil, err
		}
		if dosen == nil {
			return nil, errors.New("dosen PA tidak ditemukan")
		}
	}

	m := &domain.Mahasiswa{
		UserID:    req.UserID,
		NIM:       req.NIM,
		Nama:      req.Nama,
		Email:     req.Email,
		Jurusan:   req.Jurusan,
		Semester:  req.Semester,
		DosenPAID: req.DosenPAID,
	}

	if err := s.repo.Create(ctx, m); err != nil {
		return nil, err
	}

	// invalidasi cache list dan dashboard
	s.invalidateListCache(ctx)

	// ambil data lengkap dengan JOIN
	created, err := s.repo.FindByID(ctx, m.ID)
	if err != nil {
		return nil, err
	}

	return mapMahasiswaToDTO(created), nil
}

func (s *mahasiswaService) Update(ctx context.Context, id uint64, req *dto.UpdateMahasiswaRequest) (*dto.MahasiswaResponse, error) {
	m, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, errors.New("mahasiswa tidak ditemukan")
	}

	// Validasi NIM unik jika berubah
	if req.NIM != "" && req.NIM != m.NIM {
		existing, err := s.repo.FindByNIM(ctx, req.NIM)
		if err != nil {
			return nil, err
		}
		if existing != nil && existing.ID != id {
			return nil, errors.New("NIM sudah digunakan mahasiswa lain")
		}
		m.NIM = req.NIM
	}

	// Validasi email unik jika berubah
	if req.Email != "" && req.Email != m.Email {
		existing, err := s.repo.FindByEmail(ctx, req.Email)
		if err != nil {
			return nil, err
		}
		if existing != nil && existing.ID != id {
			return nil, errors.New("email sudah digunakan mahasiswa lain")
		}
		m.Email = req.Email
	}

	if req.Nama != "" {
		m.Nama = req.Nama
	}
	if req.Jurusan != "" {
		m.Jurusan = req.Jurusan
	}
	if req.Semester > 0 {
		m.Semester = req.Semester
	}
	m.DosenPAID = req.DosenPAID

	// Validasi dosen PA jika diberikan
	if m.DosenPAID != nil {
		dosen, err := s.dosenRepo.FindByID(ctx, *m.DosenPAID)
		if err != nil {
			return nil, err
		}
		if dosen == nil {
			return nil, errors.New("dosen PA tidak ditemukan")
		}
	}

	if err := s.repo.Update(ctx, m); err != nil {
		return nil, err
	}

	// invalidasi cache
	s.invalidateListCache(ctx)
	_ = s.cache.Delete(ctx, fmt.Sprintf("mahasiswa:%d", id))

	updated, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return mapMahasiswaToDTO(updated), nil
}

func (s *mahasiswaService) Delete(ctx context.Context, id uint64) error {
	m, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if m == nil {
		return errors.New("mahasiswa tidak ditemukan")
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}

	s.invalidateListCache(ctx)
	_ = s.cache.Delete(ctx, fmt.Sprintf("mahasiswa:%d", id))

	return nil
}

func (s *mahasiswaService) invalidateListCache(ctx context.Context) {
	_ = s.cache.DeleteByPattern(ctx, "mahasiswa:list:*")
	_ = s.cache.DeleteByPattern(ctx, "dosen:*:mahasiswa*")
	_ = s.cache.Delete(ctx, "dashboard:stats")
}

func mapMahasiswaToDTO(m *domain.Mahasiswa) *dto.MahasiswaResponse {
	return &dto.MahasiswaResponse{
		ID:          m.ID,
		UserID:      m.UserID,
		NIM:         m.NIM,
		Nama:        m.Nama,
		Email:       m.Email,
		Jurusan:     m.Jurusan,
		Semester:    m.Semester,
		DosenPAID:   m.DosenPAID,
		DosenPANama: m.DosenPANama,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
}

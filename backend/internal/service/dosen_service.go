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

// DosenService mendefinisikan kontrak business logic untuk dosen
type DosenService interface {
	GetAll(ctx context.Context, params *pagination.Params) ([]*dto.DosenResponse, int64, error)
	GetByID(ctx context.Context, id uint64) (*dto.DosenResponse, error)
	GetMahasiswaBimbingan(ctx context.Context, dosenID uint64, params *pagination.Params) ([]*dto.MahasiswaResponse, int64, error)
	Create(ctx context.Context, req *dto.CreateDosenRequest) (*dto.DosenResponse, error)
	Update(ctx context.Context, id uint64, req *dto.UpdateDosenRequest) (*dto.DosenResponse, error)
	Delete(ctx context.Context, id uint64) error
}

type dosenService struct {
	repo          repository.DosenRepository
	mahasiswaRepo repository.MahasiswaRepository
	cache         *cache.RedisCache
}

func NewDosenService(
	repo repository.DosenRepository,
	mahasiswaRepo repository.MahasiswaRepository,
	redisCache *cache.RedisCache,
) DosenService {
	return &dosenService{
		repo:          repo,
		mahasiswaRepo: mahasiswaRepo,
		cache:         redisCache,
	}
}

func (s *dosenService) GetAll(ctx context.Context, params *pagination.Params) ([]*dto.DosenResponse, int64, error) {
	cacheKey := fmt.Sprintf("dosen:list:p=%d:l=%d:q=%s", params.Page, params.Limit, params.Search)

	type cachedList struct {
		Items []*dto.DosenResponse `json:"items"`
		Total int64                `json:"total"`
	}

	var cached cachedList
	if err := s.cache.Get(ctx, cacheKey, &cached); err == nil {
		return cached.Items, cached.Total, nil
	}

	dosens, total, err := s.repo.FindAll(ctx, params)
	if err != nil {
		return nil, 0, err
	}

	items := make([]*dto.DosenResponse, 0, len(dosens))
	for _, d := range dosens {
		items = append(items, mapDosenToDTO(d))
	}

	_ = s.cache.Set(ctx, cacheKey, cachedList{Items: items, Total: total}, 5*time.Minute)

	return items, total, nil
}

func (s *dosenService) GetByID(ctx context.Context, id uint64) (*dto.DosenResponse, error) {
	cacheKey := fmt.Sprintf("dosen:%d", id)

	var cached dto.DosenResponse
	if err := s.cache.Get(ctx, cacheKey, &cached); err == nil {
		return &cached, nil
	}

	d, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if d == nil {
		return nil, errors.New("dosen tidak ditemukan")
	}

	result := mapDosenToDTO(d)
	_ = s.cache.Set(ctx, cacheKey, result, 10*time.Minute)

	return result, nil
}

func (s *dosenService) GetMahasiswaBimbingan(ctx context.Context, dosenID uint64, params *pagination.Params) ([]*dto.MahasiswaResponse, int64, error) {
	// Pastikan dosen ada
	dosen, err := s.repo.FindByID(ctx, dosenID)
	if err != nil {
		return nil, 0, err
	}
	if dosen == nil {
		return nil, 0, errors.New("dosen tidak ditemukan")
	}

	cacheKey := fmt.Sprintf("dosen:%d:mahasiswa:p=%d:l=%d:q=%s", dosenID, params.Page, params.Limit, params.Search)

	type cachedList struct {
		Items []*dto.MahasiswaResponse `json:"items"`
		Total int64                    `json:"total"`
	}

	var cached cachedList
	if err := s.cache.Get(ctx, cacheKey, &cached); err == nil {
		return cached.Items, cached.Total, nil
	}

	mahasiswas, total, err := s.mahasiswaRepo.FindByDosenPA(ctx, dosenID, params)
	if err != nil {
		return nil, 0, err
	}

	items := make([]*dto.MahasiswaResponse, 0, len(mahasiswas))
	for _, m := range mahasiswas {
		items = append(items, mapMahasiswaToDTO(m))
	}

	_ = s.cache.Set(ctx, cacheKey, cachedList{Items: items, Total: total}, 5*time.Minute)

	return items, total, nil
}

func (s *dosenService) Create(ctx context.Context, req *dto.CreateDosenRequest) (*dto.DosenResponse, error) {
	existing, err := s.repo.FindByNIDN(ctx, req.NIDN)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("NIDN sudah terdaftar")
	}

	existingEmail, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existingEmail != nil {
		return nil, errors.New("email dosen sudah terdaftar")
	}

	d := &domain.Dosen{
		UserID: req.UserID,
		NIDN:   req.NIDN,
		Nama:   req.Nama,
		Email:  req.Email,
		Prodi:  req.Prodi,
	}

	if err := s.repo.Create(ctx, d); err != nil {
		return nil, err
	}

	s.invalidateListCache(ctx)

	return mapDosenToDTO(d), nil
}

func (s *dosenService) Update(ctx context.Context, id uint64, req *dto.UpdateDosenRequest) (*dto.DosenResponse, error) {
	d, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if d == nil {
		return nil, errors.New("dosen tidak ditemukan")
	}

	if req.NIDN != "" && req.NIDN != d.NIDN {
		existing, err := s.repo.FindByNIDN(ctx, req.NIDN)
		if err != nil {
			return nil, err
		}
		if existing != nil && existing.ID != id {
			return nil, errors.New("NIDN sudah digunakan dosen lain")
		}
		d.NIDN = req.NIDN
	}

	if req.Email != "" && req.Email != d.Email {
		existing, err := s.repo.FindByEmail(ctx, req.Email)
		if err != nil {
			return nil, err
		}
		if existing != nil && existing.ID != id {
			return nil, errors.New("email sudah digunakan dosen lain")
		}
		d.Email = req.Email
	}

	if req.Nama != "" {
		d.Nama = req.Nama
	}
	if req.Prodi != "" {
		d.Prodi = req.Prodi
	}

	if err := s.repo.Update(ctx, d); err != nil {
		return nil, err
	}

	s.invalidateListCache(ctx)
	_ = s.cache.Delete(ctx, fmt.Sprintf("dosen:%d", id))

	return mapDosenToDTO(d), nil
}

func (s *dosenService) Delete(ctx context.Context, id uint64) error {
	d, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if d == nil {
		return errors.New("dosen tidak ditemukan")
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}

	s.invalidateListCache(ctx)
	_ = s.cache.Delete(ctx, fmt.Sprintf("dosen:%d", id))

	return nil
}

func (s *dosenService) invalidateListCache(ctx context.Context) {
	_ = s.cache.DeleteByPattern(ctx, "dosen:list:*")
	_ = s.cache.Delete(ctx, "dashboard:stats")
}

func mapDosenToDTO(d *domain.Dosen) *dto.DosenResponse {
	return &dto.DosenResponse{
		ID:        d.ID,
		UserID:    d.UserID,
		NIDN:      d.NIDN,
		Nama:      d.Nama,
		Email:     d.Email,
		Prodi:     d.Prodi,
		CreatedAt: d.CreatedAt,
		UpdatedAt: d.UpdatedAt,
	}
}

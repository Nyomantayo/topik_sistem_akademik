package service

import (
	"context"
	"time"

	"topsus-krs/internal/repository"
	"topsus-krs/pkg/cache"
)

type DashboardStats struct {
	TotalMahasiswa      int64                    `json:"total_mahasiswa"`
	TotalDosen          int64                    `json:"total_dosen"`
	MahasiswaPerJurusan []map[string]interface{} `json:"mahasiswa_per_jurusan"`
	DosenPerProdi       []map[string]interface{} `json:"dosen_per_prodi"`
}

// DashboardService mendefinisikan kontrak untuk statistik dashboard
type DashboardService interface {
	GetStats(ctx context.Context) (*DashboardStats, error)
}

type dashboardService struct {
	mahasiswaRepo repository.MahasiswaRepository
	dosenRepo     repository.DosenRepository
	cache         *cache.RedisCache
}

func NewDashboardService(
	mahasiswaRepo repository.MahasiswaRepository,
	dosenRepo repository.DosenRepository,
	redisCache *cache.RedisCache,
) DashboardService {
	return &dashboardService{
		mahasiswaRepo: mahasiswaRepo,
		dosenRepo:     dosenRepo,
		cache:         redisCache,
	}
}

func (s *dashboardService) GetStats(ctx context.Context) (*DashboardStats, error) {
	const cacheKey = "dashboard:stats"

	var cached DashboardStats
	if err := s.cache.Get(ctx, cacheKey, &cached); err == nil {
		return &cached, nil
	}

	totalMahasiswa, err := s.mahasiswaRepo.CountTotal(ctx)
	if err != nil {
		return nil, err
	}

	totalDosen, err := s.dosenRepo.CountTotal(ctx)
	if err != nil {
		return nil, err
	}

	mahasiswaPerJurusan, err := s.mahasiswaRepo.CountByJurusan(ctx)
	if err != nil {
		return nil, err
	}

	dosenPerProdi, err := s.dosenRepo.CountByProdi(ctx)
	if err != nil {
		return nil, err
	}

	// Pastikan slice tidak nil agar JSON tetap array kosong bukan null
	if mahasiswaPerJurusan == nil {
		mahasiswaPerJurusan = []map[string]interface{}{}
	}
	if dosenPerProdi == nil {
		dosenPerProdi = []map[string]interface{}{}
	}

	stats := &DashboardStats{
		TotalMahasiswa:      totalMahasiswa,
		TotalDosen:          totalDosen,
		MahasiswaPerJurusan: mahasiswaPerJurusan,
		DosenPerProdi:       dosenPerProdi,
	}

	// cache statistik selama 2 menit
	_ = s.cache.Set(ctx, cacheKey, stats, 2*time.Minute)

	return stats, nil
}

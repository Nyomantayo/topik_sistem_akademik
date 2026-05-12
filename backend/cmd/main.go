package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"

	"topsus-krs/config"
	"topsus-krs/internal/handler"
	"topsus-krs/internal/repository"
	"topsus-krs/internal/routes"
	"topsus-krs/internal/service"
	"topsus-krs/migrations"
	"topsus-krs/pkg/cache"
)

func main() {
	// Load konfigurasi dari .env
	cfg := config.LoadConfig()

	// Inisialisasi koneksi database
	db := config.InitDB(cfg)
	defer db.Close()

	// Auto-migrate database (create tables + seed data jika belum ada)
	migrations.RunMigration(db)

	// Inisialisasi koneksi Redis
	redisClient := config.InitRedis(cfg)
	defer redisClient.Close()

	// Inisialisasi Redis cache wrapper
	redisCache := cache.NewRedisCache(redisClient)

	// ─── Repository Layer ─────────────────────────────────────────────────────
	userRepo := repository.NewUserRepository(db)
	mahasiswaRepo := repository.NewMahasiswaRepository(db)
	dosenRepo := repository.NewDosenRepository(db)

	// ─── Service Layer ────────────────────────────────────────────────────────
	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret, cfg.JWTExpiry)
	mahasiswaSvc := service.NewMahasiswaService(mahasiswaRepo, dosenRepo, redisCache)
	dosenSvc := service.NewDosenService(dosenRepo, mahasiswaRepo, redisCache)
	dashboardSvc := service.NewDashboardService(mahasiswaRepo, dosenRepo, redisCache)

	// ─── Handler Layer ────────────────────────────────────────────────────────
	handlers := &routes.Handlers{
		Auth:      handler.NewAuthHandler(authSvc),
		Mahasiswa: handler.NewMahasiswaHandler(mahasiswaSvc),
		Dosen:     handler.NewDosenHandler(dosenSvc),
		Dashboard: handler.NewDashboardHandler(dashboardSvc),
	}

	// ─── Echo Server ──────────────────────────────────────────────────────────
	e := echo.New()
	e.HideBanner = true

	routes.Setup(e, handlers, cfg.JWTSecret, cfg.CORSOrigin)

	// Graceful shutdown
	go func() {
		log.Printf("🚀 Server berjalan di port %s (env: %s)", cfg.AppPort, cfg.AppEnv)
		if err := e.Start(":" + cfg.AppPort); err != nil {
			log.Printf("Server stopped: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		log.Fatal("Server shutdown error:", err)
	}
	log.Println("Server berhenti dengan graceful")
}

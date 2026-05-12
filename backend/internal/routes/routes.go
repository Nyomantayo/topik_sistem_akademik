package routes

import (
	"strings"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"

	"topsus-krs/internal/handler"
	"topsus-krs/internal/middleware"
)

type Handlers struct {
	Auth      *handler.AuthHandler
	Mahasiswa *handler.MahasiswaHandler
	Dosen     *handler.DosenHandler
	Dashboard *handler.DashboardHandler
}

// Setup mendaftarkan semua route ke instance Echo
func Setup(e *echo.Echo, h *Handlers, jwtSecret, corsOrigin string) {
	// Global middleware
	e.Use(echoMiddleware.Logger())
	e.Use(echoMiddleware.Recover())

	// Support multiple CORS origins (dipisahkan koma)
	origins := strings.Split(corsOrigin, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins: origins,
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{
			echo.HeaderOrigin,
			echo.HeaderContentType,
			echo.HeaderAccept,
			echo.HeaderAuthorization,
		},
		AllowCredentials: true,
	}))

	// Health check
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(200, map[string]string{"status": "ok", "service": "krs-akademik"})
	})

	api := e.Group("/api")

	// ─── Public Routes ────────────────────────────────────────────────────────
	auth := api.Group("/auth")
	auth.POST("/register", h.Auth.Register)
	auth.POST("/login", h.Auth.Login)
	auth.POST("/guest", h.Auth.GuestLogin)

	// ─── Protected Routes ─────────────────────────────────────────────────────
	jwtMw    := middleware.JWTMiddleware(jwtSecret)
	denyGuest := middleware.DenyGuest()

	// Auth (profile management) — tamu tidak diizinkan
	authProtected := api.Group("/auth", jwtMw, denyGuest)
	authProtected.GET("/profile", h.Auth.GetProfile)
	authProtected.PUT("/profile", h.Auth.UpdateProfile)
	authProtected.PUT("/change-password", h.Auth.ChangePassword)

	// Dashboard — tamu tidak diizinkan
	api.GET("/dashboard/stats", h.Dashboard.GetStats, jwtMw, denyGuest)

	// Mahasiswa routes (admin dan dosen bisa baca, admin bisa CRUD)
	mhs := api.Group("/mahasiswa", jwtMw)
	mhs.GET("", h.Mahasiswa.GetAll)
	mhs.GET("/me", h.Mahasiswa.GetMe) // harus sebelum /:id
	mhs.GET("/:id", h.Mahasiswa.GetByID)
	mhs.POST("", h.Mahasiswa.Create, middleware.RequireRole("admin"))
	mhs.PUT("/:id", h.Mahasiswa.Update, middleware.RequireRole("admin"))
	mhs.DELETE("/:id", h.Mahasiswa.Delete, middleware.RequireRole("admin"))

	// Dosen routes
	dsn := api.Group("/dosen", jwtMw)
	dsn.GET("", h.Dosen.GetAll)
	dsn.GET("/:id", h.Dosen.GetByID)
	dsn.GET("/:id/mahasiswa", h.Dosen.GetMahasiswaBimbingan)
	dsn.POST("", h.Dosen.Create, middleware.RequireRole("admin"))
	dsn.PUT("/:id", h.Dosen.Update, middleware.RequireRole("admin"))
	dsn.DELETE("/:id", h.Dosen.Delete, middleware.RequireRole("admin"))
}

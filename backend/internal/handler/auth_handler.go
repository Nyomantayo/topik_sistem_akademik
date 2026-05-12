package handler

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"

	"topsus-krs/internal/dto"
	"topsus-krs/internal/service"
	"topsus-krs/pkg/response"
	"topsus-krs/utils"
)

type AuthHandler struct {
	authService service.AuthService
	validate    *validator.Validate
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validate:    validator.New(),
	}
}

// Register godoc
// POST /api/auth/register
func (h *AuthHandler) Register(c echo.Context) error {
	var req dto.RegisterRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Format request tidak valid")
	}

	if err := h.validate.Struct(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, map[string]interface{}{
			"success": false,
			"message": "Validasi gagal",
			"errors":  formatValidationErrors(err),
		})
	}

	result, err := h.authService.Register(c.Request().Context(), &req)
	if err != nil {
		return response.Conflict(c, err.Error())
	}

	return response.Created(c, "Registrasi berhasil", result)
}

// Login godoc
// POST /api/auth/login
func (h *AuthHandler) Login(c echo.Context) error {
	var req dto.LoginRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Format request tidak valid")
	}

	if err := h.validate.Struct(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, map[string]interface{}{
			"success": false,
			"message": "Validasi gagal",
			"errors":  formatValidationErrors(err),
		})
	}

	result, err := h.authService.Login(c.Request().Context(), &req)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err.Error())
	}

	return response.Success(c, "Login berhasil", result)
}

// GuestLogin godoc
// POST /api/auth/guest
func (h *AuthHandler) GuestLogin(c echo.Context) error {
	result, err := h.authService.GuestLogin(c.Request().Context())
	if err != nil {
		return response.InternalError(c, "Gagal membuat sesi tamu")
	}
	return response.Success(c, "Masuk sebagai tamu berhasil", result)
}

// GetProfile godoc
// GET /api/auth/profile
func (h *AuthHandler) GetProfile(c echo.Context) error {
	claims := c.Get("user").(*utils.JWTClaims)

	profile, err := h.authService.GetProfile(c.Request().Context(), claims.UserID)
	if err != nil {
		return response.NotFound(c, err.Error())
	}

	return response.Success(c, "Profil berhasil diambil", profile)
}

// UpdateProfile godoc
// PUT /api/auth/profile
func (h *AuthHandler) UpdateProfile(c echo.Context) error {
	claims := c.Get("user").(*utils.JWTClaims)

	var req dto.UpdateProfileRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Format request tidak valid")
	}

	if err := h.validate.Struct(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, map[string]interface{}{
			"success": false,
			"message": "Validasi gagal",
			"errors":  formatValidationErrors(err),
		})
	}

	profile, err := h.authService.UpdateProfile(c.Request().Context(), claims.UserID, &req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, "Profil berhasil diperbarui", profile)
}

// ChangePassword godoc
// PUT /api/auth/change-password
func (h *AuthHandler) ChangePassword(c echo.Context) error {
	claims := c.Get("user").(*utils.JWTClaims)

	var req dto.ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Format request tidak valid")
	}

	if err := h.validate.Struct(&req); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, map[string]interface{}{
			"success": false,
			"message": "Validasi gagal",
			"errors":  formatValidationErrors(err),
		})
	}

	if err := h.authService.ChangePassword(c.Request().Context(), claims.UserID, &req); err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, "Password berhasil diubah", nil)
}

// formatValidationErrors mengubah error validator menjadi format yang lebih readable
func formatValidationErrors(err error) map[string]string {
	errors := make(map[string]string)
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			errors[e.Field()] = e.Tag()
		}
	}
	return errors
}

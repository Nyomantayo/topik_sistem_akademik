package handler

import (
	"net/http"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"

	"topsus-krs/internal/dto"
	"topsus-krs/internal/service"
	"topsus-krs/pkg/pagination"
	"topsus-krs/pkg/response"
	"topsus-krs/utils"
)

type MahasiswaHandler struct {
	mahasiswaService service.MahasiswaService
	validate         *validator.Validate
}

func NewMahasiswaHandler(mahasiswaService service.MahasiswaService) *MahasiswaHandler {
	return &MahasiswaHandler{
		mahasiswaService: mahasiswaService,
		validate:         validator.New(),
	}
}

// GetAll godoc
// GET /api/mahasiswa?page=1&limit=10&search=
func (h *MahasiswaHandler) GetAll(c echo.Context) error {
	params := pagination.FromContext(c)

	mahasiswas, total, err := h.mahasiswaService.GetAll(c.Request().Context(), params)
	if err != nil {
		return response.InternalError(c, "Gagal mengambil data mahasiswa")
	}

	return response.Paginated(c, "Data mahasiswa berhasil diambil", mahasiswas, params.Page, params.Limit, total)
}

// GetMe godoc
// GET /api/mahasiswa/me — khusus mahasiswa yang sedang login
func (h *MahasiswaHandler) GetMe(c echo.Context) error {
	claims := c.Get("user").(*utils.JWTClaims)

	mahasiswa, err := h.mahasiswaService.GetMyProfile(c.Request().Context(), claims.UserID)
	if err != nil {
		return response.NotFound(c, err.Error())
	}

	return response.Success(c, "Data mahasiswa berhasil diambil", mahasiswa)
}

// GetByID godoc
// GET /api/mahasiswa/:id
func (h *MahasiswaHandler) GetByID(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return response.BadRequest(c, "ID tidak valid")
	}

	mahasiswa, err := h.mahasiswaService.GetByID(c.Request().Context(), id)
	if err != nil {
		return response.NotFound(c, err.Error())
	}

	return response.Success(c, "Detail mahasiswa berhasil diambil", mahasiswa)
}

// Create godoc
// POST /api/mahasiswa
func (h *MahasiswaHandler) Create(c echo.Context) error {
	var req dto.CreateMahasiswaRequest
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

	mahasiswa, err := h.mahasiswaService.Create(c.Request().Context(), &req)
	if err != nil {
		return response.Conflict(c, err.Error())
	}

	return response.Created(c, "Mahasiswa berhasil ditambahkan", mahasiswa)
}

// Update godoc
// PUT /api/mahasiswa/:id
func (h *MahasiswaHandler) Update(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return response.BadRequest(c, "ID tidak valid")
	}

	var req dto.UpdateMahasiswaRequest
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

	mahasiswa, err := h.mahasiswaService.Update(c.Request().Context(), id, &req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, "Mahasiswa berhasil diperbarui", mahasiswa)
}

// Delete godoc
// DELETE /api/mahasiswa/:id
func (h *MahasiswaHandler) Delete(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return response.BadRequest(c, "ID tidak valid")
	}

	if err := h.mahasiswaService.Delete(c.Request().Context(), id); err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, "Mahasiswa berhasil dihapus", nil)
}

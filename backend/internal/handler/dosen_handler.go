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
)

type DosenHandler struct {
	dosenService service.DosenService
	validate     *validator.Validate
}

func NewDosenHandler(dosenService service.DosenService) *DosenHandler {
	return &DosenHandler{
		dosenService: dosenService,
		validate:     validator.New(),
	}
}

// GetAll godoc
// GET /api/dosen?page=1&limit=10&search=
func (h *DosenHandler) GetAll(c echo.Context) error {
	params := pagination.FromContext(c)

	dosens, total, err := h.dosenService.GetAll(c.Request().Context(), params)
	if err != nil {
		return response.InternalError(c, "Gagal mengambil data dosen")
	}

	return response.Paginated(c, "Data dosen berhasil diambil", dosens, params.Page, params.Limit, total)
}

// GetByID godoc
// GET /api/dosen/:id
func (h *DosenHandler) GetByID(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return response.BadRequest(c, "ID tidak valid")
	}

	dosen, err := h.dosenService.GetByID(c.Request().Context(), id)
	if err != nil {
		return response.NotFound(c, err.Error())
	}

	return response.Success(c, "Detail dosen berhasil diambil", dosen)
}

// GetMahasiswaBimbingan godoc
// GET /api/dosen/:id/mahasiswa?page=1&limit=10&search=
func (h *DosenHandler) GetMahasiswaBimbingan(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return response.BadRequest(c, "ID tidak valid")
	}

	params := pagination.FromContext(c)

	mahasiswas, total, err := h.dosenService.GetMahasiswaBimbingan(c.Request().Context(), id, params)
	if err != nil {
		return response.NotFound(c, err.Error())
	}

	return response.Paginated(c, "Data mahasiswa bimbingan berhasil diambil", mahasiswas, params.Page, params.Limit, total)
}

// Create godoc
// POST /api/dosen
func (h *DosenHandler) Create(c echo.Context) error {
	var req dto.CreateDosenRequest
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

	dosen, err := h.dosenService.Create(c.Request().Context(), &req)
	if err != nil {
		return response.Conflict(c, err.Error())
	}

	return response.Created(c, "Dosen berhasil ditambahkan", dosen)
}

// Update godoc
// PUT /api/dosen/:id
func (h *DosenHandler) Update(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return response.BadRequest(c, "ID tidak valid")
	}

	var req dto.UpdateDosenRequest
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

	dosen, err := h.dosenService.Update(c.Request().Context(), id, &req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, "Dosen berhasil diperbarui", dosen)
}

// Delete godoc
// DELETE /api/dosen/:id
func (h *DosenHandler) Delete(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return response.BadRequest(c, "ID tidak valid")
	}

	if err := h.dosenService.Delete(c.Request().Context(), id); err != nil {
		return response.BadRequest(c, err.Error())
	}

	return response.Success(c, "Dosen berhasil dihapus", nil)
}

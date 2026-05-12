package response

import (
	"math"
	"net/http"

	"github.com/labstack/echo/v4"
)

// ─── Response Structs ─────────────────────────────────────────────────────────

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type ErrorResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Errors  interface{} `json:"errors,omitempty"`
}

type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

type PaginatedResponse struct {
	Success    bool           `json:"success"`
	Message    string         `json:"message"`
	Data       interface{}    `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
}

// ─── Success Responses ────────────────────────────────────────────────────────

func Success(c echo.Context, message string, data interface{}) error {
	return c.JSON(http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Created(c echo.Context, message string, data interface{}) error {
	return c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func NoContent(c echo.Context) error {
	return c.NoContent(http.StatusNoContent)
}

func Paginated(c echo.Context, message string, data interface{}, page, limit int, total int64) error {
	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return c.JSON(http.StatusOK, PaginatedResponse{
		Success: true,
		Message: message,
		Data:    data,
		Pagination: PaginationMeta{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
			HasNext:    page < totalPages,
			HasPrev:    page > 1,
		},
	})
}

// ─── Error Responses ──────────────────────────────────────────────────────────

func Error(c echo.Context, code int, message string) error {
	return c.JSON(code, ErrorResponse{
		Success: false,
		Message: message,
	})
}

func ValidationError(c echo.Context, errors interface{}) error {
	return c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
		Success: false,
		Message: "Validasi gagal",
		Errors:  errors,
	})
}

func BadRequest(c echo.Context, message string) error {
	return Error(c, http.StatusBadRequest, message)
}

func Unauthorized(c echo.Context, message string) error {
	return Error(c, http.StatusUnauthorized, message)
}

func Forbidden(c echo.Context, message string) error {
	return Error(c, http.StatusForbidden, message)
}

func NotFound(c echo.Context, message string) error {
	return Error(c, http.StatusNotFound, message)
}

func Conflict(c echo.Context, message string) error {
	return Error(c, http.StatusConflict, message)
}

func InternalError(c echo.Context, message string) error {
	return Error(c, http.StatusInternalServerError, message)
}

package handler

import (
	"topsus-krs/internal/service"
	"topsus-krs/pkg/response"

	"github.com/labstack/echo/v4"
)

type DashboardHandler struct {
	dashboardService service.DashboardService
}

func NewDashboardHandler(dashboardService service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboardService: dashboardService}
}

// GetStats godoc
// GET /api/dashboard/stats
func (h *DashboardHandler) GetStats(c echo.Context) error {
	stats, err := h.dashboardService.GetStats(c.Request().Context())
	if err != nil {
		return response.InternalError(c, "Gagal mengambil statistik dashboard")
	}

	return response.Success(c, "Statistik dashboard berhasil diambil", stats)
}

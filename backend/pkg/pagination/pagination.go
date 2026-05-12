package pagination

import (
	"strconv"

	"github.com/labstack/echo/v4"
)

// Params menyimpan parameter untuk query pagination
type Params struct {
	Page   int    `json:"page"`
	Limit  int    `json:"limit"`
	Search string `json:"search"`
	Offset int    `json:"-"`
}

// FromContext mengambil parameter pagination dari query string Echo context
func FromContext(c echo.Context) *Params {
	page, err := strconv.Atoi(c.QueryParam("page"))
	if err != nil || page <= 0 {
		page = 1
	}

	limit, err := strconv.Atoi(c.QueryParam("limit"))
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	return &Params{
		Page:   page,
		Limit:  limit,
		Search: c.QueryParam("search"),
		Offset: (page - 1) * limit,
	}
}

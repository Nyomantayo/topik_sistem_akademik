package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"topsus-krs/utils"
)

// DenyGuest memblokir akses dari role "guest"
func DenyGuest() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			claims, ok := c.Get("user").(*utils.JWTClaims)
			if ok && claims != nil && claims.Role == "guest" {
				return c.JSON(http.StatusForbidden, map[string]interface{}{
					"success": false,
					"message": "Fitur ini tidak tersedia untuk tamu. Silakan login terlebih dahulu.",
				})
			}
			return next(c)
		}
	}
}

// RequireRole memastikan user memiliki salah satu role yang diizinkan
func RequireRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			claims, ok := c.Get("user").(*utils.JWTClaims)
			if !ok || claims == nil {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"success": false,
					"message": "Akses tidak diizinkan",
				})
			}

			for _, role := range roles {
				if claims.Role == role {
					return next(c)
				}
			}

			return c.JSON(http.StatusForbidden, map[string]interface{}{
				"success": false,
				"message": "Anda tidak memiliki hak akses untuk resource ini",
			})
		}
	}
}

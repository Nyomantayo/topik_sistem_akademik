package middleware

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"topsus-krs/utils"
)

// JWTMiddleware memvalidasi token Bearer dari header Authorization
func JWTMiddleware(jwtSecret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"success": false,
					"message": "Token tidak ditemukan",
				})
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"success": false,
					"message": "Format token tidak valid. Gunakan: Bearer <token>",
				})
			}

			claims, err := utils.ParseToken(parts[1], jwtSecret)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"success": false,
					"message": "Token tidak valid atau sudah kadaluarsa",
				})
			}

			// Simpan claims ke context agar bisa diakses di handler
			c.Set("user", claims)
			c.Set("userID", claims.UserID)
			c.Set("userRole", claims.Role)
			c.Set("userName", claims.Name)

			return next(c)
		}
	}
}

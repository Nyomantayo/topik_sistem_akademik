package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	jwt.RegisteredClaims
	UserID uint64 `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Name   string `json:"name"`
}

// GenerateToken membuat JWT token untuk user yang berhasil login
func GenerateToken(userID uint64, email, role, name, secret string, expiryHours int) (string, error) {
	claims := &JWTClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   email,
		},
		UserID: userID,
		Email:  email,
		Role:   role,
		Name:   name,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ParseToken mem-parsing dan memvalidasi JWT token
func ParseToken(tokenString, secret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

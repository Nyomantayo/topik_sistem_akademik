package utils

import "golang.org/x/crypto/bcrypt"

// HashPassword mengubah password plain text menjadi bcrypt hash
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword memverifikasi password plain text dengan hash yang tersimpan
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

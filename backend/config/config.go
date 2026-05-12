package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

type Config struct {
	AppPort    string
	AppEnv     string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPass     string
	DBName     string
	RedisHost  string
	RedisPort  string
	RedisPass  string
	JWTSecret  string
	JWTExpiry  int
	CORSOrigin string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	jwtExpiry, err := strconv.Atoi(getEnv("JWT_EXPIRY", "24"))
	if err != nil {
		jwtExpiry = 24
	}

	return &Config{
		AppPort:    getEnv("APP_PORT", "8080"),
		AppEnv:     getEnv("APP_ENV", "development"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPass:     getEnv("DB_PASS", ""),
		DBName:     getEnv("DB_NAME", "krs_db"),
		RedisHost:  getEnv("REDIS_HOST", "localhost"),
		RedisPort:  getEnv("REDIS_PORT", "6379"),
		RedisPass:  getEnv("REDIS_PASS", ""),
		JWTSecret:  getEnv("JWT_SECRET", "default-secret"),
		JWTExpiry:  jwtExpiry,
		CORSOrigin: getEnv("CORS_ORIGIN", "http://localhost:5173"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func InitDB(cfg *Config) *sqlx.DB {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&collation=utf8mb4_unicode_ci&loc=Local",
		cfg.DBUser, cfg.DBPass, cfg.DBHost, cfg.DBPort, cfg.DBName,
	)

	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(3 * time.Minute)

	log.Println("✅ Database connected successfully")
	return db
}

func InitRedis(cfg *Config) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password:     cfg.RedisPass,
		DB:           0,
		PoolSize:     10,
		MinIdleConns: 3,
	})

	log.Println("✅ Redis connected successfully")
	return rdb
}

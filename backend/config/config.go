package config

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"strconv"
	"strings"
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

	// Railway menyediakan variabel PORT, gunakan sebagai fallback
	appPort := getEnv("APP_PORT", "")
	if appPort == "" {
		appPort = getEnv("PORT", "8080")
	}

	jwtExpiry, err := strconv.Atoi(getEnv("JWT_EXPIRY", "24"))
	if err != nil {
		jwtExpiry = 24
	}

	// Default database config
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "3306")
	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASS", "")
	dbName := getEnv("DB_NAME", "krs_db")

	// Railway menyediakan MYSQL_URL — parse otomatis jika tersedia
	if mysqlURL := getEnv("MYSQL_URL", ""); mysqlURL != "" {
		if u, parseErr := url.Parse(mysqlURL); parseErr == nil {
			dbHost = u.Hostname()
			if p := u.Port(); p != "" {
				dbPort = p
			}
			dbUser = u.User.Username()
			dbPass, _ = u.User.Password()
			dbName = strings.TrimPrefix(u.Path, "/")
			log.Println("📡 Using MYSQL_URL from Railway")
		}
	}

	// Default Redis config
	redisHost := getEnv("REDIS_HOST", "localhost")
	redisPort := getEnv("REDIS_PORT", "6379")
	redisPass := getEnv("REDIS_PASS", "")

	// Railway menyediakan REDIS_URL — parse otomatis jika tersedia
	if redisURL := getEnv("REDIS_URL", ""); redisURL != "" {
		if u, parseErr := url.Parse(redisURL); parseErr == nil {
			redisHost = u.Hostname()
			if p := u.Port(); p != "" {
				redisPort = p
			}
			redisPass, _ = u.User.Password()
			log.Println("📡 Using REDIS_URL from Railway")
		}
	}

	return &Config{
		AppPort:    appPort,
		AppEnv:     getEnv("APP_ENV", "development"),
		DBHost:     dbHost,
		DBPort:     dbPort,
		DBUser:     dbUser,
		DBPass:     dbPass,
		DBName:     dbName,
		RedisHost:  redisHost,
		RedisPort:  redisPort,
		RedisPass:  redisPass,
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

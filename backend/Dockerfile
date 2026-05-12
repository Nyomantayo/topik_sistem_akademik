# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies terlebih dahulu untuk memanfaatkan layer cache Docker
COPY go.mod go.sum ./
RUN go mod download

# Copy semua source code
COPY . .

# Build binary dengan optimasi ukuran
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o krs-backend ./cmd/main.go

# ─── Stage 2: Production Image ───────────────────────────────────────────────
FROM alpine:3.19

# Tambah ca-certificates untuk HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary dari stage builder
COPY --from=builder /app/krs-backend .
COPY --from=builder /app/.env .

EXPOSE 8080

CMD ["./krs-backend"]

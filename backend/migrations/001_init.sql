-- ============================================================
-- KRS Akademik Modern - Database Migration
-- Version: 001 - Initial Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS krs_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE krs_db;

-- ============================================================
-- TABLE: users
-- Menyimpan data akun pengguna sistem (admin, mahasiswa, dosen)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(255)    NOT NULL,
    email      VARCHAR(255)    NOT NULL,
    password   VARCHAR(255)    NOT NULL,
    role       ENUM('admin', 'mahasiswa', 'dosen') NOT NULL DEFAULT 'mahasiswa',
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: dosen
-- Dosen harus dibuat sebelum mahasiswa karena mahasiswa
-- memiliki foreign key ke dosen (dosen_pa_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS dosen (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED         DEFAULT NULL,
    nidn       VARCHAR(20)     NOT NULL,
    nama       VARCHAR(255)    NOT NULL,
    email      VARCHAR(255)    NOT NULL,
    prodi      VARCHAR(255)    NOT NULL,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_dosen_nidn (nidn),
    UNIQUE KEY uq_dosen_email (email),
    UNIQUE KEY uq_dosen_user_id (user_id),
    CONSTRAINT fk_dosen_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: mahasiswa
-- ============================================================
CREATE TABLE IF NOT EXISTS mahasiswa (
    id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED           DEFAULT NULL,
    nim         VARCHAR(20)      NOT NULL,
    nama        VARCHAR(255)     NOT NULL,
    email       VARCHAR(255)     NOT NULL,
    jurusan     VARCHAR(255)     NOT NULL,
    semester    TINYINT UNSIGNED NOT NULL DEFAULT 1,
    dosen_pa_id BIGINT UNSIGNED           DEFAULT NULL,
    created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mahasiswa_nim (nim),
    UNIQUE KEY uq_mahasiswa_email (email),
    UNIQUE KEY uq_mahasiswa_user_id (user_id),
    KEY idx_mahasiswa_dosen_pa (dosen_pa_id),
    KEY idx_mahasiswa_jurusan (jurusan),
    CONSTRAINT fk_mahasiswa_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_mahasiswa_dosen_pa FOREIGN KEY (dosen_pa_id)
        REFERENCES dosen (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: Default Admin User
-- Password: Admin@123 (bcrypt hash cost=10)
-- Gunakan endpoint POST /api/auth/register untuk membuat akun baru
-- ============================================================
INSERT IGNORE INTO users (name, email, password, role)
VALUES ('Administrator', 'admin@krs.ac.id',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');

-- Password di atas adalah hash dari string "password"
-- Ganti dengan hash baru setelah login pertama kali

-- ============================================================
-- SEED DATA: Sample Dosen
-- ============================================================
INSERT IGNORE INTO dosen (nidn, nama, email, prodi) VALUES
('0123456701', 'Dr. Budi Santoso, M.Kom', 'budi.santoso@krs.ac.id', 'Teknik Informatika'),
('0123456702', 'Dr. Siti Rahayu, M.T', 'siti.rahayu@krs.ac.id', 'Sistem Informasi'),
('0123456703', 'Prof. Agus Widodo, Ph.D', 'agus.widodo@krs.ac.id', 'Teknik Informatika'),
('0123456704', 'Dr. Dewi Lestari, M.Sc', 'dewi.lestari@krs.ac.id', 'Sistem Informasi');

-- ============================================================
-- SEED DATA: Sample Mahasiswa
-- ============================================================
INSERT IGNORE INTO mahasiswa (nim, nama, email, jurusan, semester, dosen_pa_id) VALUES
('2305551001', 'Andi Pratama', 'andi.pratama@student.krs.ac.id', 'Teknik Informatika', 5, 1),
('2305551002', 'Budi Wicaksono', 'budi.wicaksono@student.krs.ac.id', 'Teknik Informatika', 3, 1),
('2305551003', 'Citra Dewi', 'citra.dewi@student.krs.ac.id', 'Sistem Informasi', 7, 2),
('2305551004', 'Dian Pertiwi', 'dian.pertiwi@student.krs.ac.id', 'Teknik Informatika', 1, 3),
('2305551005', 'Eka Saputra', 'eka.saputra@student.krs.ac.id', 'Sistem Informasi', 5, 2),
('2305551006', 'Fajar Nugroho', 'fajar.nugroho@student.krs.ac.id', 'Teknik Informatika', 3, 1),
('2305551007', 'Gita Puspita', 'gita.puspita@student.krs.ac.id', 'Sistem Informasi', 5, 4),
('2305551008', 'Hendra Kurniawan', 'hendra.kurniawan@student.krs.ac.id', 'Teknik Informatika', 7, 3);

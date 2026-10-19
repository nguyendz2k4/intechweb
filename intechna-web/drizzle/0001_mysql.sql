-- MariaDB 10.6 / MySQL 8. Empty schema: no sample content is inserted.
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(191) NOT NULL UNIQUE,
  name TEXT NOT NULL, brand TEXT NOT NULL, category TEXT NOT NULL, category_slug VARCHAR(191) NOT NULL,
  badges JSON NULL, summary TEXT NULL, specs JSON NULL, applications JSON NULL,
  image_url TEXT NULL, datasheet_url TEXT NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'published',
  created_at DATETIME(3) DEFAULT (UTC_TIMESTAMP(3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(191) NOT NULL UNIQUE, title TEXT NOT NULL,
  description TEXT NULL, body MEDIUMTEXT NULL, status ENUM('published','draft') NOT NULL DEFAULT 'published',
  published_at DATETIME(3) DEFAULT (UTC_TIMESTAMP(3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(191) NOT NULL UNIQUE, title TEXT NOT NULL,
  description TEXT NULL, keywords TEXT NULL, deliverables JSON NOT NULL, benefits JSON NOT NULL,
  status ENUM('published','draft') NOT NULL DEFAULT 'draft'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS warranty (
  id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(191) NOT NULL UNIQUE,
  serial TEXT NOT NULL, customer TEXT NOT NULL, product TEXT NOT NULL,
  purchase_date VARCHAR(10) NULL, warranty_until VARCHAR(10) NULL,
  status VARCHAR(80) DEFAULT 'Còn bảo hành', note TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NULL, note TEXT NULL,
  submitted_at DATETIME(3) DEFAULT (UTC_TIMESTAMP(3)),
  status ENUM('mới','đang xử lý','đã xử lý') NOT NULL DEFAULT 'mới'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS security_rate_limits (
  bucket_hash VARCHAR(64) PRIMARY KEY, count INT NOT NULL CHECK (count > 0), expires_at DATETIME(3) NOT NULL,
  INDEX security_rate_limits_expiry_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS security_totp_replays (
  account_hash VARCHAR(64) NOT NULL, counter BIGINT NOT NULL, expires_at DATETIME(3) NOT NULL,
  PRIMARY KEY (account_hash, counter), INDEX security_totp_replays_expiry_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS security_admin_credentials (
  username VARCHAR(80) PRIMARY KEY, password_hash TEXT NULL, totp_encrypted TEXT NULL,
  revision VARCHAR(64) NOT NULL, updated_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE IF NOT EXISTS security_admin_sessions (
  token_hash VARCHAR(64) PRIMARY KEY, username VARCHAR(80) NOT NULL, version VARCHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL, pending_totp TEXT NULL, pending_expires_at DATETIME(3) NULL,
  INDEX security_admin_sessions_username_idx (username), INDEX security_admin_sessions_expiry_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'reading_orders.db');
export const db = new DatabaseSync(DB_PATH);

// Kích hoạt foreign keys và WAL mode
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Khởi tạo các bảng
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS universes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      accent_color TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      universe_id INTEGER REFERENCES universes(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      UNIQUE(universe_id, slug)
    );

    CREATE TABLE IF NOT EXISTS reading_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      universe_id INTEGER REFERENCES universes(id) ON DELETE SET NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      description TEXT,
      year_published TEXT,
      featured_characters TEXT,
      previous_event_title TEXT,
      previous_event_slug TEXT,
      next_event_title TEXT,
      next_event_slug TEXT,
      cover_image TEXT,
      is_published INTEGER DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reading_order_id INTEGER NOT NULL REFERENCES reading_orders(id) ON DELETE CASCADE,
      tab_type TEXT DEFAULT 'single', -- 'single' hoặc 'tpb'
      title TEXT NOT NULL,
      issue_type TEXT DEFAULT 'ongoing', -- 'ongoing' (đen), 'limited' (xanh lá), 'oneshot' (đỏ), 'comment' (xanh dương)
      year TEXT,
      note TEXT,
      read_url TEXT, -- Link đọc truyện do Admin cấu hình
      read_target TEXT DEFAULT '_blank',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_noncanon INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reading_order_id INTEGER NOT NULL,
      issue_id INTEGER NOT NULL,
      is_read INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, reading_order_id, issue_id)
    );

    CREATE INDEX IF NOT EXISTS idx_reading_orders_slug ON reading_orders(slug);
    CREATE INDEX IF NOT EXISTS idx_reading_orders_universe ON reading_orders(universe_id);
    CREATE INDEX IF NOT EXISTS idx_issues_order ON issues(reading_order_id, tab_type, sort_order);
    CREATE INDEX IF NOT EXISTS idx_user_progress ON user_progress(user_id, reading_order_id);
  `);

  try {
    db.exec('ALTER TABLE issues ADD COLUMN is_noncanon INTEGER DEFAULT 0');
  } catch (e) {
    // Đã có cột is_noncanon
  }

  // Đảm bảo tài khoản Quản trị viên mặc định luôn tồn tại
  try {
    const checkAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
    if (!checkAdmin) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('admin123', 10);
      db.prepare('INSERT INTO admins (username, password_hash, display_name) VALUES (?, ?, ?)').run('admin', hash, 'Quản Trị Viên');
      console.log('-> Đã tự động tạo tài khoản admin mặc định: admin / admin123');
    }
  } catch (err: any) {
    console.warn('[DB] Lỗi tạo admin mặc định:', err.message);
  }
}

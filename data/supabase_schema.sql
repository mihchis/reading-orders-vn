-- =========================================================
-- SUPABASE POSTGRESQL SCHEMA CHO READING ORDERS VN
-- Dự án: lhllsgrvedsumyjhzssy (Supabase Cloud)
-- =========================================================

-- 1. BẢNG UNIVERSES (Vũ trụ)
CREATE TABLE IF NOT EXISTS universes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0
);

INSERT INTO universes (slug, name, accent_color, description, sort_order) VALUES
('marvel', 'Marvel Comics', '#e23636', 'Vũ trụ Marvel - Nơi hội tụ các siêu anh hùng Avengers, Spider-Man, X-Men...', 1),
('dc', 'DC Comics', '#0476f2', 'Vũ trụ DC - Thế giới của Batman, Superman, Justice League...', 2),
('other', 'Truyện Tranh Khác', '#10b981', 'Vũ trụ độc lập Indie: The Boys, Invincible, Hellboy, Spawn, TMNT...', 3)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  accent_color = EXCLUDED.accent_color;

-- 2. BẢNG CATEGORIES (Thể loại / Danh mục)
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  universe_id BIGINT REFERENCES universes(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  UNIQUE(universe_id, slug)
);

-- 3. BẢNG READING_ORDERS (Thứ tự đọc)
CREATE TABLE IF NOT EXISTS reading_orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  direct_slug TEXT,
  title TEXT NOT NULL,
  universe_id BIGINT REFERENCES universes(id) ON DELETE SET NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  universe_slug TEXT,
  category_slug TEXT,
  url TEXT,
  description TEXT,
  year_published TEXT,
  featured_characters TEXT,
  previous_event_title TEXT,
  previous_event_slug TEXT,
  next_event_title TEXT,
  next_event_slug TEXT,
  cover_image TEXT,
  is_published BOOLEAN DEFAULT true,
  total_issues INT DEFAULT 0,
  timeline_order INT,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG ISSUES (Các tập truyện)
CREATE TABLE IF NOT EXISTS issues (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reading_order_id BIGINT NOT NULL REFERENCES reading_orders(id) ON DELETE CASCADE,
  tab_type TEXT DEFAULT 'single',
  title TEXT NOT NULL,
  issue_type TEXT DEFAULT 'ongoing',
  year TEXT,
  note TEXT,
  read_url TEXT,
  read_target TEXT DEFAULT '_blank',
  sort_order INT NOT NULL DEFAULT 0,
  is_noncanon BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG FAQS
CREATE TABLE IF NOT EXISTS faqs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- 6. BẢNG ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG TIẾN ĐỘ ĐỌC NGƯỜI DÙNG (USER PROGRESS)
CREATE TABLE IF NOT EXISTS user_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_order_slug TEXT NOT NULL,
  issue_sort_order INT NOT NULL,
  is_read BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reading_order_slug, issue_sort_order)
);

-- 8. INDEXES TỐI ƯU HIỆU NĂNG TÌM KIẾM
CREATE INDEX IF NOT EXISTS idx_reading_orders_slug ON reading_orders(slug);
CREATE INDEX IF NOT EXISTS idx_reading_orders_universe ON reading_orders(universe_id);
CREATE INDEX IF NOT EXISTS idx_reading_orders_category ON reading_orders(category_id);
CREATE INDEX IF NOT EXISTS idx_issues_order ON issues(reading_order_id, tab_type, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_progress ON user_progress(user_id, reading_order_slug);

-- 9. BẬT ROW LEVEL SECURITY (RLS)
ALTER TABLE universes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- 10. CHÍNH SÁCH RLS (POLICIES)
CREATE POLICY "Cho phép tất cả đọc universes" ON universes FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc reading_orders" ON reading_orders FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc issues" ON issues FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc faqs" ON faqs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Người dùng quản lý tiến độ cá nhân" ON user_progress;
CREATE POLICY "Người dùng quản lý tiến độ cá nhân" 
ON user_progress FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

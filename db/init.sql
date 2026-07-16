-- 分享圣乐团数据库初始化

CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('mv', 'audio')),
  file_path TEXT DEFAULT '',
  thumbnail_path TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE TABLE IF NOT EXISTS sheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER NOT NULL,
  page_num INTEGER NOT NULL DEFAULT 1,
  image_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- 创建默认乐团
INSERT OR IGNORE INTO artists (id, name, description) 
VALUES (1, '分享圣乐团', '分享圣乐团 - 你们白白地得来，也要白白地舍去');

-- 索引
CREATE INDEX IF NOT EXISTS idx_songs_type ON songs(type);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist_id);
CREATE TABLE IF NOT EXISTS accompaniment_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER,
  title TEXT NOT NULL,
  file_path TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_accompaniment_song ON accompaniment_files(song_id);

CREATE INDEX IF NOT EXISTS idx_sheets_song ON sheets(song_id);

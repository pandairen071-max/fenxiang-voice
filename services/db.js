const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../db/database.sqlite');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initSQL = fs.readFileSync(path.join(__dirname, '../db/init.sql'), 'utf8');
db.exec(initSQL);

function relativePath(absPath) {
  const uploadsDir = path.join(__dirname, '../public/uploads');
  return absPath.replace(uploadsDir + '/', '').replace(uploadsDir + '\\', '');
}

const artists = {
  getAll: () => db.prepare('SELECT * FROM artists ORDER BY id').all(),
  getById: (id) => db.prepare('SELECT * FROM artists WHERE id = ?').get(id),
  getOrCreate: (name, description = '') => {
    const existing = db.prepare('SELECT * FROM artists WHERE name = ?').get(name);
    if (existing) return existing;
    const result = db.prepare('INSERT INTO artists (name, description) VALUES (?, ?)').run(name, description);
    return db.prepare('SELECT * FROM artists WHERE id = ?').get(result.lastInsertRowid);
  },
  create: (name, nameEn = '', description = '') => {
    const result = db.prepare('INSERT INTO artists (name, name_en, description) VALUES (?, ?, ?)').run(name, nameEn, description);
    return db.prepare('SELECT * FROM artists WHERE id = ?').get(result.lastInsertRowid);
  }
};

const songs = {
  getAll: (type = null) => {
    if (type) {
      return db.prepare(`
        SELECT s.*, a.name as artist_name
        FROM songs s
        JOIN artists a ON a.id = s.artist_id
        WHERE s.type = ?
        ORDER BY s.created_at DESC
      `).all(type);
    }
    return db.prepare(`
      SELECT s.*, a.name as artist_name
      FROM songs s
      JOIN artists a ON a.id = s.artist_id
      ORDER BY s.created_at DESC
    `).all();
  },

  getById: (id) => {
    return db.prepare(`
      SELECT s.*, a.name as artist_name
      FROM songs s
      JOIN artists a ON a.id = s.artist_id
      WHERE s.id = ?
    `).get(id);
  },

  getByArtist: (artistId, type = null) => {
    if (type) {
      return db.prepare(`
        SELECT * FROM songs WHERE artist_id = ? AND type = ? ORDER BY created_at DESC
      `).all(artistId, type);
    }
    return db.prepare('SELECT * FROM songs WHERE artist_id = ? ORDER BY created_at DESC').all(artistId);
  },

  create: (artistId, title, type, filePath = '', thumbnailPath = '', duration = 0, description = '') => {
    const result = db.prepare(`
      INSERT INTO songs (artist_id, title, type, file_path, thumbnail_path, duration, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(artistId, title, type, filePath, thumbnailPath, duration, description);
    return db.prepare('SELECT * FROM songs WHERE id = ?').get(result.lastInsertRowid);
  },

  update: (id, data) => {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      if (['title', 'file_path', 'thumbnail_path', 'duration', 'description'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    db.prepare(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  delete: (id) => {
    return db.prepare('DELETE FROM songs WHERE id = ?').run(id);
  }
};

const sheets = {
  getAll: (songId = null) => {
    if (songId) {
      return db.prepare('SELECT * FROM sheets WHERE song_id = ? ORDER BY page_num').all(songId);
    }
    return db.prepare(`
      SELECT sh.*, s.title as song_title, s.type as song_type
      FROM sheets sh
      JOIN songs s ON s.id = sh.song_id
      ORDER BY sh.song_id, sh.page_num
    `).all();
  },

  getBySong: (songId) => {
    return db.prepare('SELECT * FROM sheets WHERE song_id = ? ORDER BY page_num').all(songId);
  },

  add: (songId, pageNum, imagePath) => {
    const result = db.prepare('INSERT INTO sheets (song_id, page_num, image_path) VALUES (?, ?, ?)').run(songId, pageNum, imagePath);
    return result.lastInsertRowid;
  },

  addBatch: (songId, imagePaths) => {
    const stmt = db.prepare('INSERT INTO sheets (song_id, page_num, image_path) VALUES (?, ?, ?)');
    const insertMany = db.transaction((paths) => {
      paths.forEach((p, i) => stmt.run(songId, i + 1, p));
    });
    insertMany(imagePaths);
  },

  delete: (id) => {
    return db.prepare('DELETE FROM sheets WHERE id = ?').run(id);
  },

  deleteBySong: (songId) => {
    return db.prepare('DELETE FROM sheets WHERE song_id = ?').run(songId);
  },

  count: () => {
    return db.prepare('SELECT COUNT(*) as count FROM sheets').get().count;
  }
};

const accompaniment = {
  getAll: () => {
    return db.prepare(`
      SELECT ac.*, s.title as song_title
      FROM accompaniment_files ac
      LEFT JOIN songs s ON s.id = ac.song_id
      ORDER BY ac.created_at DESC
    `).all();
  },

  getById: (id) => {
    return db.prepare(`
      SELECT ac.*, s.title as song_title
      FROM accompaniment_files ac
      LEFT JOIN songs s ON s.id = ac.song_id
      WHERE ac.id = ?
    `).get(id);
  },

  create: (title, filePath = '', duration = 0, songId = null) => {
    const result = db.prepare(`
      INSERT INTO accompaniment_files (song_id, title, file_path, duration)
      VALUES (?, ?, ?, ?)
    `).run(songId, title, filePath, duration);
    return db.prepare('SELECT * FROM accompaniment_files WHERE id = ?').get(result.lastInsertRowid);
  },

  update: (id, data) => {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      if (['title', 'file_path', 'duration', 'song_id'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    db.prepare(`UPDATE accompaniment_files SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  delete: (id) => {
    return db.prepare('DELETE FROM accompaniment_files WHERE id = ?').run(id);
  },

  count: () => {
    return db.prepare('SELECT COUNT(*) as count FROM accompaniment_files').get().count;
  }
};

const stats = {
  get: () => {
    const mvCount = db.prepare("SELECT COUNT(*) as count FROM songs WHERE type = 'mv'").get().count;
    const audioCount = db.prepare("SELECT COUNT(*) as count FROM songs WHERE type = 'audio'").get().count;
    const sheetCount = sheets.count();
    const accCount = accompaniment.count();
    return { mvCount, audioCount, sheetCount, accCount };
  }
};

module.exports = { db, artists, songs, sheets, stats, accompaniment };

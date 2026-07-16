const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { artists, songs, sheets, stats, accompaniment } = require('../services/db');

// ============ 静态资源路径 ============
const UPLOADS_BASE = path.join(__dirname, '../public/uploads');
const mvDir = path.join(UPLOADS_BASE, 'mv');
const audioDir = path.join(UPLOADS_BASE, 'audio');
const sheetsDir = path.join(UPLOADS_BASE, 'sheets');
const accDir = path.join(UPLOADS_BASE, 'accompaniment');

// 确保目录存在
[mvDir, audioDir, sheetsDir, accDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============ Multer 配置 ============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = UPLOADS_BASE;
    if (req.baseUrl.includes('/mv') || req.path.includes('mv')) dest = mvDir;
    else if (req.baseUrl.includes('/accompaniment')) dest = accDir;
    else if (req.baseUrl.includes('/audio') || req.path.includes('audio')) dest = audioDir;
    else if (req.path.includes('sheet')) dest = sheetsDir;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// ============ 通用中间件 ============
function relativePath(absPath) {
  return absPath.replace(UPLOADS_BASE + '/', '').replace(UPLOADS_BASE + '\\', '');
}

// ============ 统计接口 ============
router.get('/stats', (req, res) => {
  res.json(stats.get());
});

// ============ MV 接口 ============
router.get('/mv', (req, res) => {
  try {
    res.json(songs.getAll('mv'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/mv/:id', (req, res) => {
  try {
    const song = songs.getById(parseInt(req.params.id));
    if (!song || song.type !== 'mv') return res.status(404).json({ error: 'MV不存在' });
    res.json(song);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/mv', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, description, artist_id } = req.body;
    const artistId = parseInt(artist_id) || 1;
    const videoPath = req.files?.video?.[0] ? relativePath(req.files.video[0].path) : '';
    const thumbnailPath = req.files?.thumbnail?.[0] ? relativePath(req.files.thumbnail[0].path) : '';
    
    const song = songs.create(artistId, title, 'mv', videoPath, thumbnailPath, 0, description || '');
    res.json(song);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/mv/:id', (req, res) => {
  try {
    const song = songs.getById(parseInt(req.params.id));
    if (!song) return res.status(404).json({ error: '不存在' });
    // 删除文件
    if (song.file_path) {
      const f = path.join(UPLOADS_BASE, song.file_path);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    if (song.thumbnail_path) {
      const f = path.join(UPLOADS_BASE, song.thumbnail_path);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    songs.delete(song.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ 音频 接口 ============
router.get('/audio', (req, res) => {
  try {
    res.json(songs.getAll('audio'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/audio/:id', (req, res) => {
  try {
    const song = songs.getById(parseInt(req.params.id));
    if (!song || song.type !== 'audio') return res.status(404).json({ error: '音频不存在' });
    res.json(song);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/audio', upload.single('audio'), (req, res) => {
  try {
    const { title, description, artist_id } = req.body;
    const artistId = parseInt(artist_id) || 1;
    const filePath = req.file ? relativePath(req.file.path) : '';
    
    const song = songs.create(artistId, title, 'audio', filePath, '', 0, description || '');
    res.json(song);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/audio/:id', (req, res) => {
  try {
    const song = songs.getById(parseInt(req.params.id));
    if (!song) return res.status(404).json({ error: '不存在' });
    if (song.file_path) {
      const f = path.join(UPLOADS_BASE, song.file_path);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    songs.delete(song.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ 乐谱 接口 ============
router.get('/sheets', (req, res) => {
  try {
    const { song_id } = req.query;
    if (song_id) {
      res.json(sheets.getAll(parseInt(song_id)));
    } else {
      res.json(sheets.getAll());
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 上传乐谱 - 单个或多个
router.post('/sheets', upload.array('images', 50), (req, res) => {
  try {
    const { song_id, page_start } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    if (!song_id) {
      return res.status(400).json({ error: '需要指定 song_id' });
    }

    const startPage = parseInt(page_start) || 1;
    req.files.forEach((file, i) => {
      sheets.add(parseInt(song_id), startPage + i, relativePath(file.path));
    });
    
    res.json({ ok: true, count: req.files.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 批量创建歌曲并上传乐谱（一步到位）
router.post('/sheets/batch', upload.array('images', 100), (req, res) => {
  try {
    const { title, artist_id } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const artistId = parseInt(artist_id) || 1;
    // 创建临时歌曲记录（type留空，仅用于关联乐谱）
    const song = songs.create(artistId, title || '未命名', 'audio', '', '', 0, '');
    
    req.files.forEach((file, i) => {
      sheets.add(song.id, i + 1, relativePath(file.path));
    });
    
    res.json({ ok: true, song, count: req.files.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/sheets/:id', (req, res) => {
  try {
    const sheet = db.prepare('SELECT * FROM sheets WHERE id = ?').get(parseInt(req.params.id));
    if (!sheet) return res.status(404).json({ error: '不存在' });
    
    const f = path.join(UPLOADS_BASE, sheet.image_path);
    if (fs.existsSync(f)) fs.unlinkSync(f);
    
    sheets.delete(sheet.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ 搜索 ============
router.get('/search', (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    const keyword = '%' + q.trim() + '%';
    const songs_all = songs.getAll(type || null);
    const results = songs_all.filter(s =>
      s.title && s.title.includes(q.trim())
    );
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ 伴奏接口 ============
router.get('/accompaniment', (req, res) => {
  try {
    res.json(accompaniment.getAll());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/accompaniment/:id', (req, res) => {
  try {
    const acc = accompaniment.getById(parseInt(req.params.id));
    if (!acc) return res.status(404).json({ error: '伴奏不存在' });
    res.json(acc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/accompaniment', upload.single('audio'), (req, res) => {
  try {
    const { title, song_id, duration } = req.body;
    const filePath = req.file ? relativePath(req.file.path) : '';
    const acc = accompaniment.create(title || '无标题', filePath, parseInt(duration) || 0, song_id ? parseInt(song_id) : null);
    res.json(acc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/accompaniment/:id', (req, res) => {
  try {
    const acc = accompaniment.getById(parseInt(req.params.id));
    if (!acc) return res.status(404).json({ error: '不存在' });
    if (acc.file_path) {
      const f = path.join(UPLOADS_BASE, acc.file_path);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    accompaniment.delete(acc.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ 全部作品列表 ============
router.get('/songs', (req, res) => {
  try {
    const { type } = req.query;
    res.json(songs.getAll(type || null));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

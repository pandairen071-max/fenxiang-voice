const express = require('express');
const router = express.Router();
const path = require('path');

const PAGES = [
  'index', 'mv', 'audio', 'accompaniment', 'sheets', 'admin'
];

PAGES.forEach(page => {
  router.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, `../public/${page}.html`));
  });
});

// 详情页
router.get('/mv/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/mv-detail.html'));
});

router.get('/audio/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/audio-detail.html'));
});

module.exports = router;

const express = require('express');
const path = require('path');
const apiRouter = require('./routes/api');
const pagesRouter = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api', apiRouter);

// 页面路由
app.use('/', pagesRouter);

app.listen(PORT, () => {
  console.log(`🎵 分享圣乐团网站已启动: http://localhost:${PORT}`);
});

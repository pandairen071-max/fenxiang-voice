# 分享圣乐团 - 网站规格说明书

## 1. Concept & Vision

分享圣乐团官网/作品展示站。展示乐团的 MV作品、音频录音、乐谱资料。风格应该专业、优雅、温暖，体现合唱/声乐艺术的精致感。移动端优先设计。

## 2. Design Language

### 审美方向
- 参考高端音乐院校/合唱团网站风格，简约大气
- 以深色背景衬托内容（类似音乐厅的灯光氛围）
- 卡片式布局，清晰的视觉层次

### 色彩
- 主色: #C9A96E (温暖香槟金 - 呼应合唱的温暖感)
- 次色: #2C2C2C (深炭灰背景)
- 强调色: #E8D5B7 (柔和奶金色)
- 文字: #F5F5F5 (浅白) / #A0A0A0 (次要文字)
- 成功: #6BBF7B

### 字体
- 标题: "Playfair Display", serif (优雅感)
- 正文: "Inter", "Noto Sans SC", sans-serif (清晰易读)

### 动效
- 页面切换: 淡入淡出 300ms ease
- 卡片悬停: 轻微上浮 + 阴影加深 200ms
- 播放器: 进度条滑动手感流畅
- 乐谱翻页: 平滑过渡

## 3. Layout & Structure

### 页面结构
```
/                    首页 - 乐团介绍 + 三大板块入口
/mv                  MV作品列表
/mv/:id              MV详情（视频播放）
/audio               音频作品列表
/audio/:id           音频详情（播放 + 可下载）
/sheets              乐谱库（画廊视图）
/admin               管理后台（上传/管理）
```

### 导航
- 顶部固定导航栏（Logo + 三个板块 + 管理入口）
- 移动端: 汉堡菜单，侧滑抽屉导航

### 响应式策略
- 桌面: 三列卡片 / 侧边栏管理
- 平板: 两列卡片
- 手机: 单列卡片，底部播放器条

## 4. Features & Interactions

### 首页
- 乐团名称 + 标语
- 三个大入口卡片: MV / 音频 / 乐谱（带统计数字）
- 最近更新作品（各3条）

### MV 模块
- 网格卡片列表（缩略图 + 标题 + 时长）
- 点击跳转详情页
- 详情页: 内嵌视频播放器（支持YouTube embed或本地mp4）
- 相关推荐

### 音频 模块
- 播放列表视图（封面 + 标题 + 歌手 + 时长）
- 全局播放器条（底部固定）
- 播放/暂停/上一首/下一首/进度条/音量
- 可下载（如果允许）
- 波形可视化条（可选）

### 乐谱 模块
- 画廊视图（网格缩略图）
- 点击放大查看（灯箱效果，支持左右翻页、键盘翻页）
- 支持拖拽上传批量添加
- 支持按歌曲名/分类筛选

### 管理后台 /admin
- 密码保护（简单密码即可）
- **MV管理**: 上传视频/填写标题/描述
- **音频管理**: 上传音频/填写标题/描述/歌手
- **乐谱管理**: 
  - 拖拽批量上传（一次上传整个歌曲的多张乐谱）
  - 乐谱分组（关联到歌曲）
  - 批量删除/排序
- 全部支持批量操作

### 错误/空状态
- 搜索无结果: "暂无相关作品"
- 上传失败: 红色提示 + 重试按钮
- 加载中: 骨架屏/spinner

## 5. Component Inventory

### NavigationBar
- 固定顶部，深色半透明背景
- Logo左侧，导航链接居中/右侧
- 移动端汉堡按钮

### VideoCard
- 16:9 缩略图
- 播放图标叠加
- 标题 + 时长标签
- hover: 放大缩略图 + 显示播放按钮

### AudioCard
- 方形封面（60x60）
- 歌曲名 + 歌手
- 时长
- hover: 显示播放按钮

### SheetCard
- 乐谱缩略图（4:3比例）
- 歌曲名标注
- 点击灯箱打开

### AudioPlayer (全局)
- 底部固定条
- 封面 + 歌曲信息
- 播放控制（播放/暂停，上一首，下一首）
- 进度条（可拖拽）
- 音量控制
- 当前播放列表按钮
- 下载按钮（可选）

### SheetLightbox
- 全屏黑色遮罩
- 居中大图
- 左右箭头翻页
- 键盘 ← → 翻页，ESC关闭
- 缩放/平移支持

### UploadZone
- 拖拽上传区域
- 虚线边框，hover高亮
- 支持多文件
- 上传进度条

## 6. Technical Approach

### 架构
- 前后端分离: Express.js 后端 + Vanilla HTML/CSS/JS 前端
- 数据库: SQLite（复用 hymn-search 的结构，扩展 sheets 表支持更多元数据）
- 文件存储: 本地 `public/uploads/` 目录

### 数据模型
```sql
-- 艺术家/乐团表
artists: id, name, name_en, description, created_at

-- 作品表（MV/音频共用，通过 type 区分）
songs: id, artist_id, title, type ('mv'|'audio'), 
       file_path, duration, description, created_at

-- 乐谱表
sheets: id, song_id, page_num, image_path, created_at
```

### API 设计
```
GET  /api/mv              - MV列表
GET  /api/mv/:id          - MV详情
POST /api/mv              - 添加MV

GET  /api/audio           - 音频列表
GET  /api/audio/:id       - 音频详情
POST /api/audio           - 添加音频

GET  /api/sheets          - 乐谱列表（可按song_id筛选）
POST /api/sheets           - 上传导乐谱
POST /api/sheets/batch    - 批量上传

GET  /api/songs           - 全部作品（类型+标题+分类）
POST /api/import          - 批量导入（扫描文件夹）
```

### 上传接受格式
- 音频: mp3, wav, flac, ogg, m4a
- 视频: mp4, webm, mov
- 乐谱: jpg, jpeg, png, pdf（封面）

### 移动端优化
- Viewport meta 设置
- 触摸事件支持（滑动翻页）
- 适配各种屏幕宽度
- 播放器在移动端保持可用

## 7. 文件夹结构
```
fenxiang-voice/
├── SPEC.md
├── package.json
├── server.js
├── db/
│   └── init.sql
├── public/
│   ├── css/style.css
│   ├── js/app.js         (主页逻辑)
│   ├── js/player.js      (全局音频播放器)
│   ├── js/mv.js
│   ├── js/audio.js
│   ├── js/sheets.js
│   ├── js/admin.js
│   └── uploads/
│       ├── mv/
│       ├── audio/
│       └── sheets/
├── routes/
│   ├── api.js
│   └── pages.js
└── services/
    ├── db.js
    └── importer.js
```

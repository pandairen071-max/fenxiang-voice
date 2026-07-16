/**
 * 全局音频播放器
 * 页面底部固定栏，支持播放/暂停/上一首/下一首/进度拖拽
 */
class GlobalPlayer {
  constructor() {
    this.audio = new Audio();
    this.current = null;
    this.playlist = [];
    this.isPlaying = false;

    this.el = document.getElementById('globalPlayer');
    this.cover = document.getElementById('playerCover');
    this.titleEl = document.getElementById('playerTitle');
    this.artistEl = document.getElementById('playerArtist');
    this.playBtn = document.getElementById('playerPlay');
    this.prevBtn = document.getElementById('playerPrev');
    this.nextBtn = document.getElementById('playerNext');
    this.progressBar = document.getElementById('playerBar');
    this.progressFill = document.getElementById('playerFill');
    this.curTimeEl = document.getElementById('playerCurTime');
    this.durEl = document.getElementById('playerDur');

    this._bindEvents();
  }

  _bindEvents() {
    this.audio.addEventListener('timeupdate', () => this._onTimeUpdate());
    this.audio.addEventListener('ended', () => this._onEnded());
    this.audio.addEventListener('loadedmetadata', () => this._onMeta());
    this.audio.addEventListener('play', () => { this.isPlaying = true; this._updatePlayBtn(); });
    this.audio.addEventListener('pause', () => { this.isPlaying = false; this._updatePlayBtn(); });

    this.playBtn.onclick = () => this.isPlaying ? this.pause() : this.play();
    this.prevBtn.onclick = () => this.prev();
    this.nextBtn.onclick = () => this.next();

    this.progressBar.onclick = (e) => {
      if (!this.audio.duration) return;
      const rect = this.progressBar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      this.audio.currentTime = ratio * this.audio.duration;
    };
  }

  _formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  _updatePlayBtn() {
    this.playBtn.textContent = this.isPlaying ? '⏸' : '▶';
  }

  _onTimeUpdate() {
    if (!this.audio.duration) return;
    const pct = (this.audio.currentTime / this.audio.duration) * 100;
    this.progressFill.style.width = pct + '%';
    this.curTimeEl.textContent = this._formatTime(this.audio.currentTime);
  }

  _onMeta() {
    this.durEl.textContent = this._formatTime(this.audio.duration);
  }

  _onEnded() {
    this.next();
  }

  loadSong(song) {
    if (!song.file_path) return;
    this.current = song;
    this.audio.src = '/uploads/' + song.file_path;
    this.titleEl.textContent = song.title;
    this.artistEl.textContent = song.artist_name || '';
    this.el.classList.add('active');
    this.audio.load();
  }

  play() {
    if (!this.current) return;
    this.audio.play().catch(() => {});
  }

  pause() {
    this.audio.pause();
  }

  toggle() {
    this.isPlaying ? this.pause() : this.play();
  }

  prev() {
    // 简单实现：重新播放当前
    this.audio.currentTime = 0;
    this.play();
  }

  next() {
    // 简单实现：重新播放当前
    this.audio.currentTime = 0;
    this.play();
  }

  setPlaylist(songs) {
    this.playlist = songs;
  }
}

// 全局实例
window.GlobalPlayer = GlobalPlayer;

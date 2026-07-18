#!/bin/bash
# fenxiang-voice 部署脚本
# 在阿里云 ECS 上运行

set -e

APP_DIR="/opt/fenxiang-voice"
DATA_DIR="$APP_DIR/data"

echo "=========================================="
echo "  分享圣乐团 - 自动化部署脚本"
echo "=========================================="

# 1. 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "[1/5] 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "[1/5] Docker 已安装 ✓"
fi

# 2. 检查 docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "[2/5] 安装 docker-compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "[2/5] docker-compose 已安装 ✓"
fi

# 3. 创建目录
echo "[3/5] 创建部署目录..."
mkdir -p $DATA_DIR/uploads/{mv,audio,sheets,accompaniment}
mkdir -p $DATA_DIR/db

# 4. 拉取代码（如果用 git）
if [ -d "$APP_DIR/.git" ]; then
    echo "[4/5] 拉取最新代码..."
    cd $APP_DIR && git pull
else
    echo "[4/5] 请手动将代码放到 $APP_DIR"
fi

# 5. 构建并启动
echo "[5/5] 启动容器..."
cd $APP_DIR
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "=========================================="
echo "  部署完成！"
echo "  访问地址: http://你的服务器IP"
echo "=========================================="
echo ""
echo "常用命令："
echo "  查看状态: cd $APP_DIR && docker-compose ps"
echo "  查看日志: cd $APP_DIR && docker-compose logs -f"
echo "  重启服务: cd $APP_DIR && docker-compose restart"
echo "  更新部署: cd $APP_DIR && ./deploy.sh"
echo ""

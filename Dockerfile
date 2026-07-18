# Node.js 18 Alpine
FROM node:18-alpine

WORKDIR /app

# 安装 build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括 better-sqlite3 native 模块）
RUN npm install --production

# 复制源代码
COPY . .

# 创建 uploads 目录
RUN mkdir -p public/uploads/{mv,audio,sheets,accompaniment}

EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/stats || exit 1

CMD ["node", "server.js"]

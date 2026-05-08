#!/bin/bash

# 数据库初始化脚本
# 用于创建数据库和运行 Prisma 迁移

echo "开始数据库初始化..."

# 1. 创建数据库（如果不存在）
echo "正在创建数据库..."
docker exec -it $(docker-compose ps -q mysql 2>/dev/null || echo "mysql") mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS spreadjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || \
mysql -h localhost -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS spreadjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if [ $? -eq 0 ]; then
    echo "✓ 数据库创建成功"
else
    echo "✗ 数据库创建失败，请检查 MySQL 是否运行"
    exit 1
fi

# 2. 运行 Prisma 迁移
echo "正在推送 Prisma Schema..."
npx prisma db push

if [ $? -eq 0 ]; then
    echo "✓ Prisma Schema 推送成功"
else
    echo "✗ Prisma Schema 推送失败"
    exit 1
fi

echo ""
echo "================================"
echo "✓ 数据库初始化完成！"
echo "================================"
echo ""
echo "现在可以运行：npm run dev"
echo ""

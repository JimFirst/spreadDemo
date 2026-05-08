@echo off
chcp 65001 > nul
echo ====================================
echo 数据库初始化脚本
echo ====================================
echo.

REM 检查 docker 是否运行
echo 正在检查 Docker...
docker ps | findstr mysql > nul
if %ERRORLEVEL% neq 0 (
    echo ✗ MySQL 容器未运行，请先启动 MySQL: docker-compose up -d mysql
    pause
    exit /b 1
)

echo ✓ MySQL 容器运行中
echo.

REM 创建数据库
echo 正在创建数据库...
for /f "tokens=*" %%i in ('docker-compose ps -q mysql 2^>nul') do set CONTAINER_ID=%%i

if defined CONTAINER_ID (
    docker exec -it %CONTAINER_ID% mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS spreadjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" > nul 2>&1
    
    if %ERRORLEVEL% equ 0 (
        echo ✓ 数据库创建成功
    ) else (
        echo 尝试使用本地 MySQL...
        mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS spreadjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" > nul 2>&1
        
        if %ERRORLEVEL% equ 0 (
            echo ✓ 数据库创建成功
        ) else (
            echo ✗ 数据库创建失败，请检查 MySQL 配置
            echo.
            echo 请确保：
            echo 1. MySQL 正在运行
            echo 2. root 密码是 123456
            echo 3. 或者修改 server\.env 中的 DATABASE_URL
            pause
            exit /b 1
        )
    )
) else (
    echo 尝试使用本地 MySQL...
    mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS spreadjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" > nul 2>&1
    
    if %ERRORLEVEL% equ 0 (
        echo ✓ 数据库创建成功
    ) else (
        echo ✗ 数据库创建失败
        pause
        exit /b 1
    )
)

echo.

REM 运行 Prisma
echo 正在推送 Prisma Schema...
npx prisma db push

if %ERRORLEVEL% equ 0 (
    echo.
    echo ====================================
    echo ✓ 数据库初始化完成！
    echo ====================================
    echo.
    echo 现在可以运行: npm run dev
    echo.
    pause
) else (
    echo.
    echo ✗ Prisma Schema 推送失败
    pause
    exit /b 1
)

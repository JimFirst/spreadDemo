@echo off
chcp 65001 > nul
echo ====================================
echo SpreadJS 协同编辑系统启动脚本
echo ====================================
echo.

REM 检查 Node.js
where node > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ✗ 未安装 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
echo.

REM 检查依赖
if not exist "node_modules" (
    echo 安装依赖中...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ✗ 依赖安装失败
        pause
        exit /b 1
    )
)

echo ✓ 依赖已安装
echo.

REM 检查数据库
echo 检查数据库配置...
if not exist ".env" (
    echo ✗ .env 文件不存在
    echo 请复制 .env.example 为 .env 并配置数据库
    pause
    exit /b 1
)

echo ✓ .env 配置文件存在
echo.

REM 询问是否初始化数据库
echo.
set /p initDb=是否初始化数据库？(Y/N): 
if /i "%initDb%"=="Y" (
    echo.
    echo 初始化数据库...
    call npm run db:init
    
    if %ERRORLEVEL% neq 0 (
        echo ✗ 数据库初始化失败
        pause
        exit /b 1
    )
)

echo.
echo ====================================
echo 启动服务器...
echo ====================================
echo.
echo 访问地址: http://localhost:3000
echo 前端地址: http://localhost:5173
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

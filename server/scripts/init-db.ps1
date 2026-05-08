# 数据库初始化脚本 (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "数据库初始化脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 MySQL 容器
Write-Host "检查 MySQL 容器..." -NoNewline
$mysqlContainer = docker ps --filter "ancestor=mysql:8.0" --format "{{.Names}}" | Select-Object -First 1

if ($mysqlContainer) {
    Write-Host "✓ 运行中" -ForegroundColor Green
} else {
    Write-Host "✗ 未运行" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先启动 MySQL: docker-compose up -d mysql" -ForegroundColor Yellow
    Read-Host "按 Enter 退出"
    exit 1
}

# 创建数据库
Write-Host ""
Write-Host "创建数据库..." -NoNewline
try {
    docker exec $mysqlContainer mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS spreadjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 成功" -ForegroundColor Green
    } else {
        throw "数据库创建失败"
    }
} catch {
    Write-Host "✗ 失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "尝试使用本地 MySQL..." -ForegroundColor Yellow
    
    try {
        mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS spreadjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ 本地 MySQL 数据库创建成功" -ForegroundColor Green
        } else {
            throw "本地数据库创建也失败"
        }
    } catch {
        Write-Host ""
        Write-Host "✗ 数据库创建失败" -ForegroundColor Red
        Write-Host ""
        Write-Host "请确保：" -ForegroundColor Yellow
        Write-Host "1. MySQL 正在运行" -ForegroundColor Yellow
        Write-Host "2. root 密码是 123456" -ForegroundColor Yellow
        Write-Host "3. 或者修改 server\.env 中的 DATABASE_URL" -ForegroundColor Yellow
        Read-Host "按 Enter 退出"
        exit 1
    }
}

# 运行 Prisma
Write-Host ""
Write-Host "推送 Prisma Schema..." -NoNewline
npx prisma db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 数据库初始化完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "现在可以运行: npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "按 Enter 退出"
} else {
    Write-Host ""
    Write-Host "✗ Prisma Schema 推送失败" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

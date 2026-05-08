#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 简化版 - 避免 ESM 导入问题
 */

const { execSync } = require('child_process')
const fs = require('fs')

function log(message, type = 'info') {
  const icons = {
    info: '[INFO]',
    success: '[SUCCESS]',
    error: '[ERROR]',
    warning: '[WARN]',
  }

  const prefix = icons[type] || icons.info
  console.log(`${prefix} ${message}`)
}

async function initDatabase() {
  console.log('\n========================================')
  console.log('数据库初始化脚本')
  console.log('========================================\n')

  try {
    log('检查环境变量...')

    let dbUrl = 'mysql://root:123456@localhost:3306/spreadjs'

    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf-8')
      const match = envContent.match(/DATABASE_URL=(.+)/)
      if (match) {
        dbUrl = match[1].trim()
        log('环境变量加载成功')
      }
    } else {
      log('使用默认配置')
    }

    const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)

    if (urlMatch) {
      const [, user, password, host, port, database] = urlMatch

      log(`创建数据库 ${database}...`)

      try {
        const mysqlCmd = `mysql -u ${user} -p${password} -h ${host} -P ${port} -e "CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`

        execSync(mysqlCmd, { stdio: 'inherit' })
        log('数据库创建成功')
      } catch (err) {
        log('数据库创建失败: ' + err.message, 'error')
        console.error(err.message)
        process.exit(1)
      }
    } else {
      log('DATABASE_URL 格式不正确: ' + dbUrl, 'error')
      process.exit(1)
    }

    log('生成 Prisma Client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    log('Prisma Client 生成成功')

    log('推送 Prisma Schema...')
    execSync('npx prisma db push', { stdio: 'inherit' })
    log('Schema 推送成功')

    console.log('\n========================================')
    log('数据库初始化完成！')
    console.log('========================================\n')
    console.log('现在可以运行: npm run dev\n')
  } catch (error) {
    log('初始化失败: ' + error.message, 'error')
    console.error(error)
    process.exit(1)
  }
}

initDatabase()

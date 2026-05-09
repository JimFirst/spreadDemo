const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

const PORT = process.env.PORT || 3000
const MAX_WAIT_TIME = 5000
const CHECK_INTERVAL = 500

async function waitForPortFree(port, maxWait) {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWait) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
      const lines = stdout
        .trim()
        .split('\n')
        .filter((line) => line.includes(`:${port}`))

      const listeningPorts = lines.filter((line) => line.includes('LISTENING'))

      if (listeningPorts.length === 0) {
        console.log(`端口 ${port} 已释放`)
        return true
      }
    } catch (error) {
      const errorMsg = error.message || ''
      if (
        errorMsg.includes('Command failed') ||
        errorMsg.includes('no matching') ||
        errorMsg.includes('找不到') ||
        errorMsg.includes('non-zero') ||
        !error.stdout
      ) {
        console.log(`端口 ${port} 未被占用`)
        return true
      }
    }

    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL))
  }

  return false
}

async function killPort(port) {
  try {
    console.log(`检查端口 ${port} 的占用情况...`)

    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
    const lines = stdout
      .trim()
      .split('\n')
      .filter((line) => line.includes(`:${port}`))

    const pids = new Set()
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      const pid = parts[4]
      if (pid && pid !== '0' && !pids.has(pid)) {
        pids.add(pid)
      }
    }

    if (pids.size > 0) {
      console.log(`发现 ${pids.size} 个进程占用端口 ${port}: ${Array.from(pids).join(', ')}`)

      for (const pid of pids) {
        try {
          console.log(`正在终止进程 PID: ${pid}`)
          await execAsync(`powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction Stop"`, {
            timeout: 5000
          })
          console.log(`进程 ${pid} 已终止`)
        } catch (error) {
          const errorMsg = error.message || ''
          if (
            errorMsg.includes('not found') ||
            errorMsg.includes('找不到') ||
            errorMsg.includes('Cannot find a process')
          ) {
            console.log(`进程 ${pid} 不存在，可能已经退出`)
          } else if (errorMsg.includes('Operation timed out') || errorMsg.includes('超时')) {
            console.log(`进程 ${pid} 终止超时，尝试其他方法...`)
            try {
              await execAsync(`cmd /c "taskkill /PID ${pid} /T /F"`, {
                timeout: 3000
              })
              console.log(`进程 ${pid} 已通过备用方法终止`)
            } catch (fallbackError) {
              console.error(`终止进程 ${pid} 失败:`, fallbackError.message)
            }
          } else {
            console.error(`终止进程 ${pid} 失败:`, errorMsg)
          }
        }
      }

      console.log('等待端口释放...')
      const isFree = await waitForPortFree(port, MAX_WAIT_TIME)

      if (!isFree) {
        console.log(`${MAX_WAIT_TIME / 1000} 秒后仍有残留连接，尝试强制等待...`)
        const stillFree = await waitForPortFree(port, MAX_WAIT_TIME * 2)

        if (stillFree) {
          console.log(`端口 ${port} 已成功释放`)
          process.exit(0)
        } else {
          console.log(`警告: 端口 ${port} 仍然有残留连接（可能是 TIME_WAIT），继续尝试启动...`)
          process.exit(0)
        }
      } else {
        console.log(`端口 ${port} 已成功释放`)
        process.exit(0)
      }
    } else {
      console.log(`端口 ${port} 未被占用`)
      process.exit(0)
    }
  } catch (error) {
    const errorMessage = error.message || ''
    if (
      errorMessage.includes('Command failed') ||
      errorMessage.includes('no matching') ||
      errorMessage.includes('找不到') ||
      errorMessage.includes('non-zero')
    ) {
      console.log(`端口 ${port} 未被占用`)
      process.exit(0)
    }
    console.error('检查端口占用时出错:', errorMessage || '未知错误')
    process.exit(1)
  }
}

if (require.main === module) {
  killPort(PORT)
}

module.exports = { killPort }

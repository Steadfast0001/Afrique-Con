const { spawn } = require('child_process')
const waitOn = require('wait-on')

const children = []
let serversReady = false

function spawnCommand(name, command) {
  const child = spawn(command, { shell: true, cwd: __dirname, stdio: 'inherit' })
  children.push(child)

  child.on('exit', (code, signal) => {
    if (!serversReady) {
      console.error(`${name} exited before servers were ready: code=${code}, signal=${signal}`)
      process.exit(code || 1)
    }
  })
}

function cleanup() {
  children.forEach((child) => {
    if (!child.killed) {
      child.kill()
    }
  })
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.on('exit', cleanup)

async function main() {
  spawnCommand('auth', 'npm run start:auth')
  spawnCommand('preview', 'npm run preview:serve')

  try {
    await waitOn({
      resources: ['http://127.0.0.1:8001/health', 'http://localhost:5173'],
      timeout: 120000,
      interval: 500,
    })
    serversReady = true
    console.log('E2E servers ready: auth and frontend are available')
    process.stdin.resume()
  } catch (error) {
    console.error('E2E server startup failed:', error)
    cleanup()
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('E2E server failed to start:', error)
  cleanup()
  process.exit(1)
})

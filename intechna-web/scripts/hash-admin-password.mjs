import { randomBytes, scrypt } from 'node:crypto'

async function readPassword() {
  if (!process.stdin.isTTY) {
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    return Buffer.concat(chunks)
      .toString('utf8')
      .replace(/\r?\n$/, '')
  }
  process.stderr.write('Mật khẩu (ít nhất 12 ký tự, được ẩn): ')
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  return new Promise((resolve, reject) => {
    let password = ''
    function finish(error) {
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdin.removeListener('data', onData)
      process.stderr.write('\n')
      if (error) reject(error)
      else resolve(password)
    }
    function onData(chunk) {
      for (const char of chunk) {
        if (char === '\u0003') {
          finish(new Error('Đã hủy.'))
          return
        }
        if (char === '\r' || char === '\n') {
          finish()
          return
        }
        if (char === '\u007f' || char === '\b') password = password.slice(0, -1)
        else if (char >= ' ') password += char
      }
    }
    process.stdin.on('data', onData)
  })
}

try {
  const password = await readPassword()
  if (password.length < 12 || password.length > 256)
    throw new Error('Mật khẩu phải có 12–256 ký tự.')
  const salt = randomBytes(16)
  const key = await new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 },
      (error, result) => (error ? reject(error) : resolve(result)),
    )
  })
  // Only the salted password hash is printed. Never pass a password as a CLI argument.
  process.stdout.write(
    `scrypt$131072$8$1$${salt.toString('base64url')}$${key.toString('base64url')}\n`,
  )
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
}

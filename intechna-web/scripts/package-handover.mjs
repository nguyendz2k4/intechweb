import { copyFile, mkdir, readFile, writeFile, lstat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertNoCredentials, collectSourceFiles, hashFile } from './handover-files.mjs'
import { verifyHandover } from './verify-handover.mjs'
import { sourceZip } from './source-zip.mjs'

const appRoot = fileURLToPath(new URL('../', import.meta.url))

export async function packageHandover({
  root = appRoot,
  output = path.join(root, 'release'),
} = {}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const folder = path.join(output, `intechna-handover-${stamp}`)
  const files = await collectSourceFiles(root)
  const workflow = path.resolve(root, '../.github/workflows/quality.yml')
  if (!(await lstat(workflow)).isFile()) throw new Error('Quality workflow is required.')
  await mkdir(folder, { recursive: true })
  const hashes = {}
  for (const name of files) {
    const bytes = await readFile(path.join(root, ...name.split('/')))
    assertNoCredentials(name, bytes)
    const targetName = `intechna-web/${name}`
    const target = path.join(folder, ...targetName.split('/'))
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, bytes, { flag: 'wx' })
    hashes[targetName] = await hashFile(target)
  }
  const workflowName = '.github/workflows/quality.yml'
  await mkdir(path.join(folder, '.github/workflows'), { recursive: true })
  assertNoCredentials(workflowName, await readFile(workflow))
  await copyFile(workflow, path.join(folder, ...workflowName.split('/')))
  hashes[workflowName] = await hashFile(path.join(folder, ...workflowName.split('/')))
  const entry = 'BAT-DAU.md'
  await writeFile(
    path.join(folder, entry),
    '# Bàn giao website Intech\n\nĐọc [hướng dẫn cài mới và vận hành](intechna-web/docs/handover/README.md) trước khi cấu hình.\n\nMã ứng dụng ở `intechna-web/`; chạy npm tại đó. Gói không có tài khoản, database, uploads hay bản build từ môi trường thử.\n\nChủ website tạo và quản lý tài khoản hosting cPanel, MariaDB, domain/DNS và email của mình. Không có dịch vụ nào được tự động tạo hoặc triển khai khi giải nén.\n\nKiểm tra gói: `node intechna-web/scripts/verify-handover.mjs .`\n',
    { flag: 'wx' },
  )
  hashes[entry] = await hashFile(path.join(folder, entry))
  await writeFile(
    path.join(folder, 'handover-manifest.json'),
    JSON.stringify(
      {
        format: 'intechna-source-handover',
        version: 1,
        createdAt: new Date().toISOString(),
        excludes: [
          'secrets',
          'local account links',
          'database exports',
          'customer submissions',
          'warranty records',
          'runtime uploads',
          'build artifacts',
        ],
        files: hashes,
      },
      null,
      2,
    ) + '\n',
    { flag: 'wx' },
  )
  await verifyHandover(folder)
  const zip = `${folder}.zip`
  const entries = []
  for (const name of [...Object.keys(hashes), 'handover-manifest.json'].sort())
    entries.push({
      name: `${path.basename(folder)}/${name}`,
      bytes: await readFile(path.join(folder, ...name.split('/'))),
    })
  await writeFile(zip, sourceZip(entries), { flag: 'wx' })
  await writeFile(`${zip}.sha256`, `${await hashFile(zip)}  ${path.basename(zip)}\n`, {
    flag: 'wx',
  })
  return { folder, zip, fileCount: Object.keys(hashes).length }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  packageHandover()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
}

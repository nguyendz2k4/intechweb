import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { ImageResponse } from 'next/og.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const logo = await readFile(path.join(root, 'public/images/brand/intech-logo.png'))
const src = `data:image/png;base64,${logo.toString('base64')}`

// Render the existing navbar asset inside a square icon without redrawing the logo.
async function renderIcon(size) {
  const element = createElement(
    'div',
    {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e7f0f7',
        borderRadius: size * 0.16,
      },
    },
    createElement('img', { src, width: size * 0.94, height: size * 0.47 }),
  )
  return Buffer.from(await new ImageResponse(element, { width: size, height: size }).arrayBuffer())
}

const frames = []
for (const size of [16, 32, 48, 180]) {
  const png = await renderIcon(size)
  if (size === 48) await writeFile(path.join(root, 'public/favicon-48.png'), png)
  if (size === 180) await writeFile(path.join(root, 'public/apple-touch-icon.png'), png)
  else frames.push({ size, png })
}

// ICO directory entries point to the same rendered PNG frames for legacy requests.
const header = Buffer.alloc(6 + frames.length * 16)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(frames.length, 4)
let offset = header.length
for (const [index, { size, png }] of frames.entries()) {
  const entry = 6 + index * 16
  header[entry] = size
  header[entry + 1] = size
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(png.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += png.length
}
await writeFile(
  path.join(root, 'public/favicon.ico'),
  Buffer.concat([header, ...frames.map(({ png }) => png)]),
)
console.log('Generated navbar-logo favicon PNG (48), Apple icon (180), and ICO (16/32/48).')

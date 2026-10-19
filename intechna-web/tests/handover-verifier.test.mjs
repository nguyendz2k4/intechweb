import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { hashFile, sourceFiles } from '../scripts/handover-files.mjs'
import { verifyHandover } from '../scripts/verify-handover.mjs'

async function fixture(t) {
  const base = path.resolve('scratch')
  await mkdir(base, { recursive: true })
  const root = await mkdtemp(path.join(base, 'handover-verifier-'))
  t.after(async () => {
    const target = path.resolve(root)
    assert.equal(path.dirname(target), base)
    assert.ok(path.basename(target).startsWith('handover-verifier-'))
    await rm(target, { recursive: true, force: true })
  })
  const names = [
    ...sourceFiles.map((name) => `intechna-web/${name}`),
    'BAT-DAU.md',
    '.github/workflows/quality.yml',
    'intechna-web/app/layout.tsx',
    'intechna-web/app/lib/db/index.ts',
    'intechna-web/app/api/admin/auth/login/route.ts',
  ]
  const manifest = {
    format: 'intechna-source-handover',
    version: 1,
    files: {},
  }
  for (const name of names) {
    const filename = path.join(root, ...name.split('/'))
    await mkdir(path.dirname(filename), { recursive: true })
    await writeFile(filename, name.endsWith('.json') ? '{}\n' : 'Fixture source\n')
    manifest.files[name] = await hashFile(filename)
  }
  async function writeManifest() {
    await writeFile(path.join(root, 'handover-manifest.json'), JSON.stringify(manifest))
  }
  await writeManifest()
  return { root, manifest, writeManifest }
}

test('complete source handover verifies, but changing a listed source file fails its checksum', async (t) => {
  const { root, manifest } = await fixture(t)
  assert.deepEqual(await verifyHandover(root), {
    verified: true,
    fileCount: Object.keys(manifest.files).length,
  })
  await writeFile(path.join(root, 'intechna-web/app/layout.tsx'), 'Changed source\n')
  await assert.rejects(verifyHandover(root), /Changed handover file/)
})

test('missing listed files and deleting a required entry from the manifest both fail verification', async (t) => {
  const { root, manifest, writeManifest } = await fixture(t)
  const required = 'intechna-web/package-lock.json'
  await rm(path.join(root, ...required.split('/')))
  await assert.rejects(verifyHandover(root), /missing/i)
  delete manifest.files[required]
  await writeManifest()
  await assert.rejects(verifyHandover(root), /missing|required|incomplete/i)
})

test('unlisted local account state is rejected before it can become a verified handover', async (t) => {
  const { root } = await fixture(t)
  await mkdir(path.join(root, 'intechna-web/.vercel'), { recursive: true })
  await writeFile(path.join(root, 'intechna-web/.vercel/project.json'), '{}\n')
  await assert.rejects(verifyHandover(root), /Unlisted handover file/)
})

test('private owner exports stay forbidden even when listed with a correct checksum', async (t) => {
  const { root, manifest, writeManifest } = await fixture(t)
  const privateFile = 'intechna-web/data/owner/content.json'
  const filename = path.join(root, ...privateFile.split('/'))
  await mkdir(path.dirname(filename), { recursive: true })
  await writeFile(filename, '{}\n')
  manifest.files[privateFile] = await hashFile(filename)
  await writeManifest()
  await assert.rejects(verifyHandover(root), /Unapproved handover file/)
})

test('source handover rejects directory links without following them', async (t) => {
  const { root } = await fixture(t)
  const target = path.join(root, 'actual-directory')
  await mkdir(target)
  try {
    await symlink(
      target,
      path.join(root, 'linked-directory'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  } catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) {
      t.skip('This execution policy cannot create a directory link.')
      return
    }
    throw error
  }
  await assert.rejects(verifyHandover(root), /Links are not allowed/)
})

test('manifest links are rejected before the target is read or parsed', async (t) => {
  const { root } = await fixture(t)
  const manifestPath = path.join(root, 'handover-manifest.json')
  const target = path.join(root, 'untrusted-manifest-target.txt')
  await writeFile(target, 'PRIVATE_SYNTHETIC_CONTENT_THAT_MUST_NOT_APPEAR_IN_ERRORS')
  await rm(manifestPath)
  try {
    await symlink(target, manifestPath, 'file')
  } catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) {
      t.skip('This execution policy cannot create a manifest link.')
      return
    }
    throw error
  }
  await assert.rejects(verifyHandover(root), (error) => {
    assert.ok(error instanceof Error)
    assert.match(error.message, /manifest|links|regular/i)
    assert.equal(error.message.includes('PRIVATE_SYNTHETIC_CONTENT'), false)
    return true
  })
})

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = fileURLToPath(new URL('../', import.meta.url))

for (const passenger of [true, false]) {
  test(`custom server loads through require() and binds once in ${passenger ? 'Passenger' : 'local production'} mode`, () => {
    // Exercise the real entry points with Node's CommonJS loader. Next rendering
    // and socket binding are isolated so no credentials, DB or network are used.
    const nextModule = `
      import assert from 'node:assert/strict';
      export default function next(options) {
        assert.equal(options.dev, false);
        assert.ok(options.httpServer);
        assert.ok(options.dir);
        return {
          async prepare() {},
          getRequestHandler() { return async (request, response) => response.end('render-ok'); },
          async close() {},
        };
      }
    `
    const program = `
      const assert = require('node:assert/strict');
      const { registerHooks } = require('node:module');
      const http = require('node:http');
      const passengerMode = ${passenger};
      let configured = false, listening = 0, rendered = 0;
      if (passengerMode) globalThis.PhusionPassenger = {
        configure(options) { assert.deepEqual(options, {autoInstall: false}); configured = true; }
      };
      registerHooks({
        resolve(specifier, context, nextResolve) {
          if (specifier === 'next') return {url: ${JSON.stringify('data:text/javascript,' + encodeURIComponent(nextModule))}, shortCircuit: true};
          if (specifier === './scripts/load-env.mjs') return {url: 'data:text/javascript,export%20default%20null', shortCircuit: true};
          return nextResolve(specifier, context);
        }
      });
      http.Server.prototype.listen = function(...args) {
        assert.equal(configured, passengerMode);
        assert.deepEqual(args, passengerMode ? ['passenger'] : [34567, '0.0.0.0']);
        listening++;
        queueMicrotask(() => {
          this.emit('listening');
          this.emit('request', {}, {end(value) {assert.equal(value, 'render-ok'); rendered++;}});
        });
        return this;
      };
      process.once('beforeExit', () => {
        assert.equal(listening, 1);
        assert.equal(rendered, 1);
        console.log('entry-point-verified');
      });
      require('./server.js');
      require('./app.js');
    `
    const env = { NODE_ENV: 'production', PORT: '34567', HOSTNAME: '0.0.0.0' }
    if (process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot
    const result = spawnSync(process.execPath, ['--input-type=commonjs', '-e', program], {
      cwd: root,
      env,
      encoding: 'utf8',
      timeout: 10_000,
    })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /entry-point-verified/)
  })
}

for (const [stage, code] of [
  ['environment-load', 'ERR_MODULE_NOT_FOUND'],
  ['next-prepare', 'ENOENT'],
]) {
  test(`startup failure reports ${stage} without exposing exception contents`, () => {
    const nextModule = `export default function next() { return { async prepare() {
      throw Object.assign(new Error('private-password-marker'), {code: '${code}'});
    } }; }`
    const program = `
      const { registerHooks } = require('node:module');
      registerHooks({resolve(specifier, context, nextResolve) {
        if (specifier === './scripts/load-env.mjs') {
          if (${stage === 'environment-load'}) throw Object.assign(new Error('private-password-marker'), {code: '${code}'});
          return {url: 'data:text/javascript,export%20default%20null', shortCircuit: true};
        }
        if (specifier === 'next') return {url: ${JSON.stringify('data:text/javascript,' + encodeURIComponent(nextModule))}, shortCircuit: true};
        return nextResolve(specifier, context);
      }});
      require('./server.js');
    `
    const env = { NODE_ENV: 'production' }
    if (process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot
    const result = spawnSync(process.execPath, ['--input-type=commonjs', '-e', program], {
      cwd: root,
      env,
      encoding: 'utf8',
      timeout: 10_000,
    })
    assert.equal(result.status, 1)
    assert.ok(result.stderr.includes(`stage=${stage}, code=${code}`), result.stderr)
    assert.doesNotMatch(result.stderr + result.stdout, /private-password-marker/)
  })
}

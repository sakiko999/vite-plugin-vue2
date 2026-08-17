import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { transformWithOxc } from 'vite'
import vue2Plugin from '../src/index'
import { resolveCompiler } from '../src/compiler'
import { transformMain } from '../src/main'

describe('smoke', () => {
  it('creates the plugin with required hooks', () => {
    const plugin = vue2Plugin()

    expect(plugin.name).toBe('vite:vue2')
    expect(plugin).toHaveProperty('handleHotUpdate')
    expect(plugin).toHaveProperty('configResolved')
    expect(plugin).toHaveProperty('configureServer')
    expect(plugin).toHaveProperty('buildStart')
    expect(plugin).toHaveProperty('resolveId')
    expect(plugin).toHaveProperty('load')
    expect(plugin).toHaveProperty('transform')
  })

  it('resolves Vue 2.7 compiler-sfc APIs', () => {
    const compiler = resolveCompiler(process.cwd())

    expect(compiler.parse).toBeTypeOf('function')
    expect(compiler.compileTemplate).toBeTypeOf('function')
    expect(compiler.compileStyleAsync).toBeTypeOf('function')
    expect(compiler.compileScript).toBeTypeOf('function')
    expect(compiler.rewriteDefault).toBeTypeOf('function')
  })

  it('transforms TypeScript through Vite 8 Oxc', async () => {
    const result = await transformWithOxc(
      'const answer: number = 42',
      'smoke.ts',
      {
        lang: 'ts',
        sourcemap: false
      }
    )

    expect(result.code).toContain('const answer = 42')
  })

  it('transforms a TypeScript script setup SFC with sourcemap input', async () => {
    const root = path.resolve(process.cwd(), 'playground')
    const filename = path.resolve(root, 'App.vue')
    const code = fs.readFileSync(filename, 'utf-8')
    const result = await transformMain(
      code,
      filename,
      {
        compiler: resolveCompiler(process.cwd()),
        root,
        sourceMap: true,
        cssDevSourcemap: false,
        isProduction: false,
        devToolsEnabled: false
      },
      {
        error(error: any) {
          throw error
        },
        warn() {}
      } as any,
      false
    )

    expect(result?.code).toContain('export default __component__.exports')
  })
})

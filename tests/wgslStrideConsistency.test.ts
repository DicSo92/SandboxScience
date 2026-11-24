import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { PARTICLE_STRIDE, PARTICLE_BYTES } from '~/constants/particleStride'

// ---------------------------------------------------------------------------
// Regression test: every 2D GPU shader that declares a `struct Particle` must
// have EXACTLY 11 f32 fields (stride = 44 bytes). A mismatch means the GPU
// reads particle N+1 at the wrong byte offset, interpreting drive params as
// x/y coordinates — the "stride bug" that causes apparent axis swapping.
// ---------------------------------------------------------------------------

const SHADER_DIR = join(process.cwd(), 'assets', 'particle-brain-gpu', 'shaders')
const EXPECTED_PARTICLE_FIELDS = 11 // x,y,vx,vy,type,control,signal,goalB,driveTarget,driveScale,driveGain

function collectWgslFiles(dir: string): string[] {
    const results: string[] = []
    for (const entry of readdirSync(dir)) {
        if (entry === 'old') continue
        const full = join(dir, entry)
        const st = statSync(full)
        if (st.isDirectory()) {
            results.push(...collectWgslFiles(full))
        } else if (entry.endsWith('.wgsl')) {
            results.push(full)
        }
    }
    return results
}

function extractParticleFields(source: string): string[] | null {
    const match = source.match(/struct\s+Particle\s*\{([^}]+)\}/)
    if (!match) return null
    // Strip ALL line comments BEFORE splitting so commas in comments don't break parsing
    const body = match[1].replace(/\/\/[^\n]*/g, '')
    const fields: string[] = []
    for (const raw of body.split(/[;,]/)) {
        const line = raw.trim()
        if (!line) continue
        const m = line.match(/^(\w+)\s*:\s*\w+/)
        if (m) fields.push(m[1])
    }
    return fields.length > 0 ? fields : null
}

describe('WGSL Particle Stride Consistency', () => {
    it('all 2D GPU shaders declare exactly 11 Particle fields', () => {
        const files = collectWgslFiles(SHADER_DIR)
        expect(files.length).toBeGreaterThan(0)

        const mismatches: string[] = []
        let checkedCount = 0

        for (const file of files) {
            const source = readFileSync(file, 'utf-8')
            const fields = extractParticleFields(source)
            if (!fields) continue

            checkedCount++
            if (fields.length !== EXPECTED_PARTICLE_FIELDS) {
                const rel = file.replace(process.cwd() + '/', '')
                mismatches.push(`${rel}: has ${fields.length} fields [${fields.join(', ')}]`)
            }
        }

        expect(checkedCount).toBeGreaterThanOrEqual(10)
        if (mismatches.length > 0) {
            throw new Error(
                `Stride mismatch! Expected ${EXPECTED_PARTICLE_FIELDS} fields per Particle struct.\n` +
                mismatches.join('\n')
            )
        }
    })

    it('Particle field ORDER is consistent (x,y,vx,vy first)', () => {
        const files = collectWgslFiles(SHADER_DIR)
        const expectedOrder = ['x', 'y', 'vx', 'vy']

        for (const file of files) {
            const source = readFileSync(file, 'utf-8')
            const fields = extractParticleFields(source)
            if (!fields || fields.length < 4) continue

            const rel = file.replace(process.cwd() + '/', '')
            for (let i = 0; i < 4; i++) {
                expect(fields[i], `${rel}: field[${i}]`).toBe(expectedOrder[i])
            }
        }
    })

    it('no JS code uses stale *8 particle stride', () => {
        const vueFile = readFileSync(join(process.cwd(), 'components', 'particle-life', 'ParticleLifeGpu.vue'), 'utf-8')
        const lines = vueFile.split('\n')
        const suspicious: string[] = []

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const m = line.match(/(\w+)\s*\*\s*8(?!\d)/)
            if (m) {
                const lower = line.toLowerCase()
                if (lower.includes('color') || lower.includes('matrix') || lower.includes('0x')) continue
                suspicious.push(`  L${i + 1}: ${line.trim()}`)
            }
        }

        expect(suspicious, `Stale *8 stride references:\n${suspicious.join('\n')}`).toHaveLength(0)
    })
})

// ---------------------------------------------------------------------------
// Regression: SimOptions field references must match struct declarations.
// Catches the "black screen" bug where particleComputeForces.wgsl referenced
// options.magneticStrength without declaring it in its local SimOptions struct.
// ---------------------------------------------------------------------------
describe('WGSL SimOptions Field References', () => {
    /** Extract all `options.<fieldName>` references from a shader source. */
    function extractOptionRefs(source: string): Set<string> {
        const refs = new Set<string>()
        const re = /options\.(\w+)/g
        let m: RegExpExecArray | null
        while ((m = re.exec(source)) !== null) {
            refs.add(m[1])
        }
        return refs
    }

    /** Extract field names from a `struct SimOptions { ... }` block. */
    function extractSimOptionFields(source: string): Set<string> | null {
        const match = source.match(/struct\s+SimOptions\s*\{([^}]+)\}/)
        if (!match) return null
        const body = match[1].replace(/\/\/[^\n]*/g, '')
        const fields = new Set<string>()
        for (const raw of body.split(/[;,]/)) {
            const line = raw.trim()
            if (!line) continue
            const m = line.match(/^(\w+)\s*:\s*\w+/)
            if (m) fields.add(m[1])
        }
        return fields.size > 0 ? fields : null
    }

    it('every options.<field> reference exists in the shader\'s SimOptions struct', () => {
        const files = collectWgslFiles(SHADER_DIR)
        const errors: string[] = []

        for (const file of files) {
            const source = readFileSync(file, 'utf-8')
            const declared = extractSimOptionFields(source)
            if (!declared) continue // shader doesn't have SimOptions — OK

            const refs = extractOptionRefs(source)
            for (const ref of refs) {
                if (!declared.has(ref)) {
                    const rel = file.replace(process.cwd() + '/', '')
                    errors.push(`${rel}: references options.${ref} but it's not in SimOptions struct`)
                }
            }
        }

        expect(errors, `Undeclared SimOptions fields:\n${errors.join('\n')}`).toHaveLength(0)
    })
})

// ---------------------------------------------------------------------------
// Regression: Particle constructor calls must have exactly 11 args.
// Catches the "structure constructor has too few inputs" compile error.
// ---------------------------------------------------------------------------
describe('WGSL Particle Constructor Calls', () => {
    it('all Particle(...) constructor calls pass exactly 11 arguments', () => {
        const files = collectWgslFiles(SHADER_DIR)
        const errors: string[] = []

        for (const file of files) {
            const source = readFileSync(file, 'utf-8')
            // Find all `Particle(` constructor calls (not struct declarations or type refs)
            const re = /Particle\s*\(([^)]*)\)/g
            let m: RegExpExecArray | null
            while ((m = re.exec(source)) !== null) {
                const argsStr = m[1].trim()
                if (!argsStr) continue // empty parens — not a constructor call

                // Count top-level commas (no nesting in WGSL constructor calls)
                const argCount = argsStr.split(',').length
                if (argCount !== EXPECTED_PARTICLE_FIELDS) {
                    const rel = file.replace(process.cwd() + '/', '')
                    const lineNum = source.slice(0, m.index).split('\n').length
                    errors.push(`${rel}:${lineNum}: Particle(...) has ${argCount} args, expected ${EXPECTED_PARTICLE_FIELDS}`)
                }
            }
        }

        expect(errors, `Wrong arg count in Particle constructors:\n${errors.join('\n')}`).toHaveLength(0)
    })
})

// ---------------------------------------------------------------------------
// Cross-check: the JS PARTICLE_STRIDE constant MUST equal the WGSL struct
// field count. This is the "type failure" guard — if you add a field to any
// shader's `struct Particle` but forget to update the JS constant (or vice
// versa), this test fails and blocks the merge.
// ---------------------------------------------------------------------------
describe('JS ↔ WGSL Stride Cross-Check', () => {
    it('PARTICLE_STRIDE matches the WGSL Particle struct field count', () => {
        const files = collectWgslFiles(SHADER_DIR)
        let maxFields = 0
        let checkedCount = 0

        for (const file of files) {
            const source = readFileSync(file, 'utf-8')
            const fields = extractParticleFields(source)
            if (!fields) continue
            checkedCount++
            maxFields = Math.max(maxFields, fields.length)
        }

        expect(checkedCount).toBeGreaterThan(0)
        expect(
            PARTICLE_STRIDE,
            `PARTICLE_STRIDE (${PARTICLE_STRIDE}) must equal the WGSL Particle struct field count (${maxFields}). ` +
            `Update constants/particleStride.ts to match.`
        ).toBe(maxFields)
    })

    it('PARTICLE_BYTES is consistent with PARTICLE_STRIDE', () => {
        expect(PARTICLE_BYTES).toBe(PARTICLE_STRIDE * 4)
    })
})

export interface PositionOption { id: number; name: string }
type ParticlesArray = Float32Array
type PosGen = (NUM_PARTICLES: number, NUM_TYPES: number, SIM_WIDTH: number, SIM_HEIGHT: number) => ParticlesArray

// ---------------------------------------------------------------------------------------------------------------------
// ==== HELPERS ========================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
const writeParticle = (arr: Float32Array, i: number, x: number, y: number, type: number) => {
    const k = i * 5
    arr[k] = x
    arr[k + 1] = y
    arr[k + 2] = 0 // vx
    arr[k + 3] = 0 // vy
    arr[k + 4] = type
}
const randN = (mu = 0, sigma = 1) => {
    // Box–Muller
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
// ---------------------------------------------------------------------------------------------------------------------
// ==== GENERATORS =====================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
export function randomGenerator(NUM_PARTICLES: number, NUM_TYPES: number, SIM_WIDTH: number, SIM_HEIGHT: number): ParticlesArray {
    const positions = new Float32Array(NUM_PARTICLES * 5)
    for (let i = 0; i < NUM_PARTICLES; ++i) {
        const baseIndex = i * 5
        positions[baseIndex] = Math.random() * SIM_WIDTH
        positions[baseIndex + 1] = Math.random() * SIM_HEIGHT
        positions[baseIndex + 4] = Math.floor(Math.random() * NUM_TYPES)
    }
    return positions
}
export const random: PosGen = (NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT) => {
    const A = new Float32Array(NUM_PARTICLES * 5)
    let t = 0
    for (let i = 0; i < NUM_PARTICLES; i++) {
        const x = Math.random() * SIM_WIDTH
        const y = Math.random() * SIM_HEIGHT
        writeParticle(A, i, x, y, t)
        t++; if (t === NUM_TYPES) t = 0
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const disk: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const R = 0.42 * Math.min(W, H) // disk radius
    let t = 0
    for (let i = 0; i < N; i++) {
        const th = Math.random() * 6.28318530718
        const r = Math.sqrt(Math.random()) * R
        const x = cx + r * Math.cos(th)
        const y = cy + r * Math.sin(th)
        writeParticle(A, i, x, y, t)
        t++; if (t === T) t = 0
    }
    return A
}
export const rainbowDisk: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const R = 0.42 * Math.min(W, H) // disk radius
    const sector = 6.283185307179586 / Math.max(1, T)
    const base = Math.floor(N / T), rem = N % T

    let i = 0
    for (let t = 0; t < T; t++) {
        const k = base + (t < rem ? 1 : 0)
        if (!k) continue
        const dth = sector / k
        const start = t * sector + Math.random() * dth
        const c = Math.cos(dth), s = Math.sin(dth)
        let ux = Math.cos(start), uy = Math.sin(start)
        for (let j = 0; j < k; j++, i++) {
            const r = Math.sqrt(Math.random()) * R
            const x = cx + r * ux
            const y = cy + r * uy
            writeParticle(A, i, x, y, t)
            const nx = ux * c - uy * s
            uy = ux * s + uy * c
            ux = nx
        }
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const ring: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const R = 0.4 * Math.min(W, H)
    const thick = R * 0.12 // ring thickness
    const twopi = 2 * Math.PI
    const dth = twopi / Math.max(1, N)
    const c = Math.cos(dth), s = Math.sin(dth)
    let th = twopi * Math.random() / Math.max(1, N)
    let ux = Math.cos(th), uy = Math.sin(th)
    let t = 0
    for (let i = 0; i < N; i++) {
        const rr = R + (Math.random() * 2 - 1) * thick
        const x = cx + rr * ux
        const y = cy + rr * uy
        writeParticle(A, i, x, y, t)
        const nx = ux * c - uy * s
        uy = ux * s + uy * c
        ux = nx
        t++; if (t === T) t = 0
    }
    return A
}
export const rainbowRing: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const R = 0.4 * Math.min(W, H)
    const thick = 0.048 * Math.min(W, H) // ring thickness
    const twopi = 2 * Math.PI
    const sector = twopi / Math.max(1, T)
    const base = Math.floor(N / T), rem = N % T

    let i = 0
    for (let t = 0; t < T; t++) {
        const k = base + (t < rem ? 1 : 0)
        if (!k) continue
        const dth = sector / k
        const start = t * sector + dth * Math.random()
        const c = Math.cos(dth), s = Math.sin(dth)
        let ux = Math.cos(start), uy = Math.sin(start)
        for (let j = 0; j < k; j++, i++) {
            const rr = R + (Math.random() * 2 - 1) * thick
            const x = cx + rr * ux
            const y = cy + rr * uy
            writeParticle(A, i, x, y, t)
            const nx = ux * c - uy * s
            uy = ux * s + uy * c
            ux = nx
        }
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const rings: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const rings = Math.max(2, Math.min(5, Math.round(Math.sqrt(T)) + 1))
    const maxR = 0.45 * Math.min(W, H)
    const base = Math.floor(N / rings), rem = N % rings
    const twopi = 2 * Math.PI
    const thick = maxR * 0.02 // ring thickness

    let i = 0, t = 0
    for (let r = 0; r < rings; r++) {
        const k = base + (r < rem ? 1 : 0)
        if (!k) continue
        const R = maxR * (0.25 + 0.7 * (r / (rings - 1)))
        for (let j = 0; j < k; j++, i++) {
            const th = twopi * ((j + Math.random()) / k)
            const rr = R + (Math.random() * 2 - 1) * thick
            const x = cx + rr * Math.cos(th)
            const y = cy + rr * Math.sin(th)
            writeParticle(A, i, x, y, t)
            t++; if (t === T) t = 0
        }
    }
    return A
}
export const rainbowRings: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const Rmax = 0.46 * Math.min(W, H)
    const base = Math.floor(N / T), rem = N % T
    const twopi = 2 * Math.PI
    const thick = Rmax * 0.02 // ring thickness

    let i = 0
    for (let t = 0; t < T; t++) {
        const k = base + (t < rem ? 1 : 0)
        if (!k) continue
        const r = Rmax * ((t + 0.5) / T)
        for (let j = 0; j < k; j++, i++) {
            const th = twopi * ((j + Math.random()) / k)
            const rr = r + (Math.random() * 2 - 1) * thick
            const x = cx + rr * Math.cos(th)
            const y = cy + rr * Math.sin(th)
            writeParticle(A, i, x, y, t)
        }
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const spiral: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const turns = 3.0
    const maxR = 0.46 * Math.min(W, H)
    const n1 = Math.max(1, N - 1)
    const stepR = maxR / n1
    const dTheta = (turns * 2 * Math.PI) / n1
    const c = Math.cos(dTheta), s = Math.sin(dTheta)
    let ux = 1, uy = 0
    const j = 0.025 * maxR // thickness jitter

    let tType = 0
    for (let i = 0; i < N; i++) {
        const r = i * stepR
        const x = cx + r * ux + (Math.random() * 2 - 1) * j
        const y = cy + r * uy + (Math.random() * 2 - 1) * j
        writeParticle(A, i, x, y, tType)
        const nx = ux * c - uy * s
        uy = ux * s + uy * c
        ux = nx
        tType++; if (tType === T) tType = 0
    }
    return A
}
export const rainbowSpiral: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const turns = 3.0
    const maxR = 0.46 * Math.min(W, H)
    const n1 = Math.max(1, N - 1)
    const stepR = maxR / n1
    const dTheta = (turns * 2 * Math.PI) / n1
    const c = Math.cos(dTheta), s = Math.sin(dTheta)
    let ux = 1, uy = 0
    const invTau = 1 / (2 * Math.PI)
    const dPhase = dTheta * invTau
    let phase = 0
    const j = 0.025 * maxR // thickness jitter

    for (let i = 0; i < N; i++) {
        const r = i * stepR
        const x = cx + r * ux + (Math.random() * 2 - 1) * j
        const y = cy + r * uy + (Math.random() * 2 - 1) * j
        const tType = Math.floor(phase * T)
        writeParticle(A, i, x, y, tType)
        const nx = ux * c - uy * s
        uy = ux * s + uy * c
        ux = nx
        phase += dPhase
        if (phase >= 1) phase -= 1
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const line: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5
    const cy = H * 0.5
    const L = W * 0.9 // line length (90% of width)
    const thickness = H * 0.1 // thickness jitter (10% of height)
    const xStart = cx - L * 0.5
    const step = N > 1 ? L / (N - 1) : 0

    let t = 0
    for (let i = 0; i < N; i++) {
        const x = xStart + step * i
        const y = cy + (Math.random() - 0.5) * thickness
        writeParticle(A, i, x, y, t)
        t++; if (t === T) t = 0
    }
    return A
}
export const rainbowLine: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const L = W * 0.9 // line length (90% of width)
    const thickness = H * 0.1 // thickness jitter (10% of height)
    const cx = W * 0.5, cy = H * 0.5
    const xStart = cx - L * 0.5
    const segW = L / T
    const base = Math.floor(N / T), rem = N % T

    let i = 0
    for (let t = 0; t < T; t++) {
        const k = base + (t < rem ? 1 : 0)
        if (k === 0) continue
        const x0 = xStart + t * segW
        for (let j = 0; j < k; j++, i++) {
            const x = x0 + segW * ((j + Math.random()) / k)
            const y = cy + (Math.random() - 0.5) * thickness
            writeParticle(A, i, x, y, t)
        }
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const stripes: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const segW = W / T // stripe width
    const base = Math.floor(N / T), rem = N % T

    let i = 0
    for (let t = 0; t < T; t++) {
        let k = base + (t < rem ? 1 : 0)
        const x0 = t * segW
        while (k-- > 0) {
            const x = x0 + Math.random() * segW
            const y = Math.random() * H
            writeParticle(A, i, x, y, t)
            i++
        }
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const border: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const inset = 1 // inset from edges (px)

    const w = Math.max(0, W - 2 * inset)
    const h = Math.max(0, H - 2 * inset)
    const P = 2 * (w + h)
    if (N === 0 || P === 0) return A

    const step = P / N
    const L0 = w, L1 = w + h, L2 = w + h + w
    let t = 0

    for (let i = 0; i < N; i++) {
        const s = i * step
        let x: number, y: number
        if (s < L0) { x = inset + s; y = inset }
        else if (s < L1) { x = inset + w; y = inset + (s - L0) }
        else if (s < L2) { x = inset + (L2 - s); y = inset + h }
        else { x = inset; y = inset + (P - s) }
        writeParticle(A, i, x, y, t)
        t++; if (t === T) t = 0
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const grid: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const margin = 0.08 // outer margin (0..1)

    const cols = Math.ceil(Math.sqrt(N))
    const rows = Math.ceil(N / cols)
    const x0 = W * margin, x1 = W * (1 - margin)
    const y0 = H * margin, y1 = H * (1 - margin)
    const dx = (x1 - x0) / cols
    const dy = (y1 - y0) / rows

    let i = 0, t = 0
    for (let r = 0; r < rows; r++) {
        const y = y0 + (r + 0.5) * dy
        for (let c = 0; c < cols; c++) {
            if (i >= N) break
            const x = x0 + (c + 0.5) * dx
            writeParticle(A, i, x, y, t)
            i++
            t++; if (t === T) t = 0
        }
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const softClusters: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const k = Math.max(2, Math.min(T, 8)) // number of clusters
    const centers: Array<[number, number]> = []
    const margin = 0.18
    for (let c = 0; c < k; c++) {
        centers.push([
            W * (margin + Math.random() * (1 - 2 * margin)),
            H * (margin + Math.random() * (1 - 2 * margin))
        ])
    }
    const sigma = 0.06 * Math.min(W, H)
    for (let i = 0; i < N; i++) {
        const cluster = i % k
        const [cx, cy] = centers[cluster]
        const x = cx + randN(0, sigma)
        const y = cy + randN(0, sigma)
        writeParticle(A, i, x, y, i % T)
    }
    return A
}
export const linkedClusters: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const k = Math.max(2, Math.min(T, 8))    // number of clusters
    const margin = 0.18                            // edge margin (0..1)
    const sigma = 0.06 * Math.min(W, H)            // cluster radius
    const bridgeFrac = 0.18                        // fraction of bridge particles
    const bridgeWidth = 0.005 * Math.min(W, H)     // bridge thickness
    const bridgeAlong = 0.05 * Math.min(W, H)      // jitter along bridge
    const blendFrac = 0.22                         // central blend zone length fraction (0..1)
    const blendBands = 28                          // number of stripes inside blend zone

    const centers: Array<[number, number]> = []
    for (let c = 0; c < k; c++) {
        centers.push([
            W * (margin + Math.random() * (1 - 2 * margin)),
            H * (margin + Math.random() * (1 - 2 * margin)),
        ])
    }

    const edges: Array<[number, number, number, number]> = []
    const seen = new Set<string>()
    for (let a = 0; a < k; a++) {
        let best = -1, bd = Infinity
        const [ax, ay] = centers[a]
        for (let b = 0; b < k; b++) {
            if (a === b) continue
            const [bx, by] = centers[b]
            const d = (ax - bx) ** 2 + (ay - by) ** 2
            if (d < bd) { bd = d; best = b }
        }
        const u = Math.min(a, best), v = Math.max(a, best)
        const key = u + ":" + v
        if (!seen.has(key)) { seen.add(key); edges.push([u, v, u % T, v % T]) }
    }
    const extra = Math.max(0, k - 2)
    for (let e = 0; e < extra; e++) {
        const a = (Math.random() * k) | 0
        let b = (Math.random() * k) | 0
        if (b === a) b = (b + 1) % k
        const u = Math.min(a, b), v = Math.max(a, b)
        const key = u + ":" + v
        if (!seen.has(key)) { seen.add(key); edges.push([u, v, u % T, v % T]) }
    }

    const bridges = Math.min(N, Math.floor(N * bridgeFrac))
    const coreN = N - bridges

    let i = 0
    for (let n = 0; n < coreN; n++, i++) {
        const cluster = n % k
        const [cx, cy] = centers[cluster]
        const x = cx + randN(0, sigma)
        const y = cy + randN(0, sigma)
        writeParticle(A, i, x, y, cluster % T)
    }
    if (bridges === 0 || edges.length === 0) return A

    const halfBlend = Math.max(0, Math.min(0.49, blendFrac * 0.5))
    const tLeft = 0.5 - halfBlend
    const tRight = 0.5 + halfBlend
    const perEdge = Math.max(1, Math.floor(bridges / edges.length))

    let bleft = bridges
    for (let ei = 0; ei < edges.length && bleft > 0; ei++) {
        const [a, b, tA, tB] = edges[ei]
        const [ax, ay] = centers[a]
        const [bx, by] = centers[b]
        const dx = bx - ax, dy = by - ay
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len, uy = dy / len
        const nx = -uy, ny = ux

        const count = Math.min(perEdge, bleft)
        for (let j = 0; j < count && bleft > 0; j++, i++, bleft--) {
            const tpos = (j + 0.5) / count
            const along = (Math.random() * 2 - 1) * bridgeAlong
            const off = randN(0, bridgeWidth)
            const x = ax + dx * tpos + ux * along + nx * off
            const y = ay + dy * tpos + uy * along + ny * off

            let type: number
            if (tpos < tLeft) type = tA
            else if (tpos > tRight) type = tB
            else {
                const u = (tpos - tLeft) / Math.max(1e-6, (tRight - tLeft))
                const band = Math.floor(u * blendBands)
                type = (band & 1) === 0 ? tA : tB
            }
            writeParticle(A, i, x, y, type)
        }
    }

    while (bleft-- > 0) {
        const [a, b, tA, tB] = edges[(Math.random() * edges.length) | 0]
        const [ax, ay] = centers[a]
        const [bx, by] = centers[b]
        const dx = bx - ax, dy = by - ay
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len, uy = dy / len
        const nx = -uy, ny = ux

        const tpos = Math.random()
        const along = (Math.random() * 2 - 1) * bridgeAlong
        const off = randN(0, bridgeWidth)
        const x = ax + dx * tpos + ux * along + nx * off
        const y = ay + dy * tpos + uy * along + ny * off

        let type: number
        if (tpos < tLeft) type = tA
        else if (tpos > tRight) type = tB
        else {
            const u = (tpos - tLeft) / Math.max(1e-6, (tRight - tLeft))
            const band = Math.floor(u * blendBands)
            type = (band & 1) === 0 ? tA : tB
        }
        writeParticle(A, i++, x, y, type)
    }

    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const twinSpirals: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const THICK = 0.015 * Math.min(W, H)   // arm thickness
    const TURNS = 1.5 + Math.random() * 1.5 // spiral turns per arm (1.5–3)

    const cx = W * 0.5, cy = H * 0.5
    const R = 0.46 * Math.min(W, H)
    const TAU = 6.283185307179586
    const ROT = Math.random() * TAU // random global rotation

    const perm = Array.from({ length: T }, (_, i) => i)
    for (let i = T - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0
        ;[perm[i], perm[j]] = [perm[j], perm[i]]
    }
    const mid = (T + 1) >> 1
    const armColors: [number[], number[]] = [perm.slice(0, mid), perm.slice(mid)]
    if (armColors[1].length === 0) armColors[1] = armColors[0].slice()

    const base = (N / 2) | 0
    let rem = N % 2
    let i = 0

    for (let a = 0; a < 2; a++) {
        let k = base + (rem-- > 0 ? 1 : 0)
        if (k <= 0) continue

        const palette = armColors[a]
        const plen = palette.length
        let pi = (Math.random() * plen) | 0

        const th0 = ROT + a * Math.PI
        const dth = (TURNS * TAU) / Math.max(1, k - 1)
        const c = Math.cos(dth), s = Math.sin(dth)
        let ux = Math.cos(th0), uy = Math.sin(th0)

        for (let n = 0; n < k; n++, i++) {
            const u = k > 1 ? n / (k - 1) : 0
            const r = u * R
            const rr = Math.max(0, r + (Math.random() * 2 - 1) * THICK)
            const t = palette[pi]; pi++; if (pi === plen) pi = 0

            writeParticle(A, i, cx + rr * ux, cy + rr * uy, t)

            const nx = ux * c - uy * s
            uy = ux * s + uy * c
            ux = nx
        }
    }
    return A
}
export const spiralArms: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const TURNS = 2.5                 // spiral turns
    const THICK_MAX_FRAC = 0.02       // max arm thickness as fraction of min(W,H)
    const THICK_BASE_FRAC = 0.07      // thickness baseline before scaling by 1/T
    const THICK_FRAC = Math.min(THICK_MAX_FRAC, THICK_BASE_FRAC / T)
    const THICK = THICK_FRAC * Math.min(W, H)

    const cx = W * 0.5, cy = H * 0.5
    const maxR = 0.46 * Math.min(W, H)
    const TAU = 6.283185307179586

    const armOrder = Array.from({ length: T }, (_, i) => i)
    for (let i = T - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0
        ;[armOrder[i], armOrder[j]] = [armOrder[j], armOrder[i]]
    }

    const base = (N / T) | 0, rem = N % T
    let i = 0

    for (let a = 0; a < T; a++) {
        let k = base + (a < rem ? 1 : 0)
        if (k <= 0) continue

        const tType = armOrder[a]
        const th0 = (a / T) * TAU
        const dth = (TURNS * TAU) / Math.max(1, k - 1)
        const c = Math.cos(dth), s = Math.sin(dth)
        let ux = Math.cos(th0), uy = Math.sin(th0)

        for (let n = 0; n < k; n++, i++) {
            const u = k > 1 ? n / (k - 1) : 0
            const r = u * maxR
            const rr = Math.max(0, r + (Math.random() * 2 - 1) * THICK)
            writeParticle(A, i, cx + rr * ux, cy + rr * uy, tType)

            const nx = ux * c - uy * s
            uy = ux * s + uy * c
            ux = nx
        }
    }
    return A
}

export const yinYang: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const R_FRAC = 0.46   // outer radius (fraction of min(W,H))
    const EYE_FR = 1 / 6  // eye radius (fraction of R)

    const m = Math.min(W, H)
    const cx = W * 0.5, cy = H * 0.5
    const R = R_FRAC * m, R2 = R * R
    const r = 0.5 * R,   r2 = r * r
    const e = EYE_FR * R, e2 = e * e
    const TAU = 6.283185307179586

    const topCx = cx, topCy = cy - r
    const botCx = cx, botCy = cy + r

    const types = Array.from({ length: T }, (_, i) => i)
    for (let i = T - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [types[i], types[j]] = [types[j], types[i]] }
    const mid = (T + 1) >> 1
    const groupTop = types.slice(0, mid)
    const groupBot = types.slice(mid)
    const lenT = Math.max(1, groupTop.length), lenB = Math.max(1, groupBot.length)
    let it = 0, ib = 0

    const d2 = (x:number,y:number,a:number,b:number)=>{ const dx=x-a, dy=y-b; return dx*dx+dy*dy }
    let i = 0
    while (i < N) {
        const th = Math.random() * TAU
        const rr = R * Math.sqrt(Math.random())
        const x = cx + rr * Math.cos(th)
        const y = cy + rr * Math.sin(th)
        if (d2(x, y, cx, cy) > R2) continue

        let useTop = (y <= cy)
        const inTopEye = d2(x, y, topCx, topCy) <= e2
        const inBotEye = d2(x, y, botCx, botCy) <= e2
        if (inTopEye) useTop = false
        else if (inBotEye) useTop = true

        const t = useTop ? groupTop[it % lenT] : groupBot[ib % lenB]
        if (useTop) it++; else ib++
        writeParticle(A, i++, x, y, t)
    }
    return A
}
export const chromaticFlower: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const PETALS_MIN = 2        // shared petals min
    const PETALS_MAX = 7        // shared petals max
    const R_OUT = 0.46          // outer radius (fraction of min(W,H))
    const SCALE_MIN = 0.62      // min per-color radial scale (0..1)
    const JITTER = 0.006        // positional jitter (fraction of min(W,H))
    const GAMMA = 1.35          // petal sharpening (>1 = crisper petals)
    const BETA = 2.0            // soft-floor strength (higher = more outward)
    const INNER_FRAC_MIN = 0.01 // soft inner floor min (fraction of per-color max)
    const INNER_FRAC_MAX = 0.14 // soft inner floor max (fraction of per-color max)

    const m = Math.min(W, H)
    const cx = W * 0.5, cy = H * 0.5
    const Rmax = R_OUT * m
    const jitterAbs = JITTER * m
    const TAU = 2 * Math.PI
    const GA = Math.PI * (3 - Math.sqrt(5))

    const petals = PETALS_MIN + ((Math.random() * (PETALS_MAX - PETALS_MIN + 1)) | 0)

    const allTypes = Array.from({ length: T }, (_, i) => i)
    for (let i = T - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0
        const tmp = allTypes[i]; allTypes[i] = allTypes[j]; allTypes[j] = tmp
    }

    const raw = new Float32Array(T)
    for (let i = 0; i < T; i++) raw[i] = SCALE_MIN + Math.random() * (1 - SCALE_MIN)
    let smax = SCALE_MIN
    for (let i = 0; i < T; i++) if (raw[i] > smax) smax = raw[i]
    const scale = new Float32Array(T)
    if (smax === SCALE_MIN) {
        for (let i = 0; i < T; i++) scale[i] = SCALE_MIN
        scale[(Math.random() * T) | 0] = 1
    } else {
        const denom = smax - SCALE_MIN, range = 1 - SCALE_MIN
        for (let i = 0; i < T; i++) scale[i] = SCALE_MIN + ((raw[i] - SCALE_MIN) / denom) * range
    }

    const phase = new Float32Array(T)
    for (let i = 0; i < T; i++) phase[i] = Math.random() * TAU

    let idx = 0
    if (N < T) {
        for (let u = 0; u < N; u++) {
            const t = allTypes[u]
            const th = Math.random() * TAU
            const rMaxColor = Rmax * scale[t]
            const innerFrac = INNER_FRAC_MIN + Math.random() * (INNER_FRAC_MAX - INNER_FRAC_MIN)
            const rFloor = innerFrac * rMaxColor
            const g = Math.abs(Math.cos(petals * th + phase[t]))
            const shaped = Math.pow(g, GAMMA)
            const soft = (1 - Math.exp(-BETA * shaped)) / (1 - Math.exp(-BETA))
            const rr = rFloor + (rMaxColor - rFloor) * soft
            const x = cx + rr * Math.cos(th) + (Math.random() * 2 - 1) * jitterAbs
            const y = cy + rr * Math.sin(th) + (Math.random() * 2 - 1) * jitterAbs
            writeParticle(A, idx++, x, y, t)
        }
        return A
    }

    for (let u = 0; u < T; u++) {
        const t = allTypes[u]
        const th = Math.random() * TAU
        const rMaxColor = Rmax * scale[t]
        const innerFrac = INNER_FRAC_MIN + Math.random() * (INNER_FRAC_MAX - INNER_FRAC_MIN)
        const rFloor = innerFrac * rMaxColor
        const g = Math.abs(Math.cos(petals * th + phase[t]))
        const shaped = Math.pow(g, GAMMA)
        const soft = (1 - Math.exp(-BETA * shaped)) / (1 - Math.exp(-BETA))
        const rr = rFloor + (rMaxColor - rFloor) * soft
        const x = cx + rr * Math.cos(th) + (Math.random() * 2 - 1) * jitterAbs
        const y = cy + rr * Math.sin(th) + (Math.random() * 2 - 1) * jitterAbs
        writeParticle(A, idx++, x, y, t)
    }

    const remain = N - idx
    const base = (remain / T) | 0
    let rem = remain % T

    for (let u = 0; u < T; u++) {
        const t = allTypes[u]
        let k = base + (rem > 0 ? 1 : 0); if (rem > 0) rem--
        let th = Math.random() * TAU
        const rMaxColor = Rmax * scale[t]
        const innerFrac = INNER_FRAC_MIN + Math.random() * (INNER_FRAC_MAX - INNER_FRAC_MIN)
        const rFloor = innerFrac * rMaxColor

        while (k-- > 0) {
            const g = Math.abs(Math.cos(petals * th + phase[t]))
            const shaped = Math.pow(g, GAMMA)
            const soft = (1 - Math.exp(-BETA * shaped)) / (1 - Math.exp(-BETA))
            const rr = rFloor + (rMaxColor - rFloor) * soft
            const x = cx + rr * Math.cos(th) + (Math.random() * 2 - 1) * jitterAbs
            const y = cy + rr * Math.sin(th) + (Math.random() * 2 - 1) * jitterAbs
            writeParticle(A, idx++, x, y, t)
            th += GA + (Math.random() - 0.5) * 0.06
            if (th >= TAU) th -= TAU
            else if (th < 0) th += TAU
        }
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const wavyBands: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const segH = H / T
    const amp = 0.06 * H                   // wave amplitude
    const kx  = (2 * Math.PI / W) * (1 + (T % 3)) // wave frequency
    const jitter = 0.02 * H                // vertical uniform noise

    // randomize band (color) order
    const types = new Int32Array(T)
    for (let i = 0; i < T; i++) types[i] = i
    for (let i = T - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0
        const ti = types[i]; types[i] = types[j]; types[j] = ti
    }

    // per-band counts without perTypeCounts
    const base = (N / T) | 0
    const rem  = N % T

    // precompute per-band y0 and phase
    const basePhase = Math.random() * 2 * Math.PI
    const y0s = new Float32Array(T)
    const phases = new Float32Array(T)
    for (let i = 0; i < T; i++) {
        y0s[i] = (i + 0.5) * segH
        phases[i] = basePhase + i * 0.7
    }

    let idx = 0
    for (let i = 0; i < T; i++) {
        const t = types[i]
        let n = base + (i < rem ? 1 : 0)
        const y0 = y0s[i]
        const ph = phases[i]
        while (n-- > 0) {
            const x = Math.random() * W
            let y = y0 + amp * Math.sin(kx * x + ph) + (Math.random() * 2 - 1) * jitter
            if (y < 0) y = 0
            else if (y > H) y = H
            writeParticle(A, idx++, x, y, t)
        }
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const polarMaze: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const mwh = Math.min(W, H)
    const cx = W * 0.5, cy = H * 0.5

    const LAYERS = 6                 // number of rings
    const SECTORS = 18               // angular divisions
    const GAP = 0.04                 // sector inner gap [0..1]
    const THICK = 0.012 * mwh        // ring thickness

    const Rmin = 0.12 * mwh
    const Rmax = 0.46 * mwh
    const dr = (Rmax - Rmin) / LAYERS
    const dth = (2 * Math.PI) / SECTORS

    // assign random colors per layer ensuring all appear at least once
    const allTypes = Array.from({ length: T }, (_, i) => i)
    const layerTypes: number[][] = Array.from({ length: LAYERS }, () => [])
    const shuffled = allTypes.slice().sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffled.length; i++) {
        layerTypes[i % LAYERS].push(shuffled[i])
    }
    // randomly add extra colors to random layers for more variety
    for (let t = 0; t < T; t++) {
        if (Math.random() < 0.35) layerTypes[(Math.random() * LAYERS) | 0].push(t)
    }

    const base = (N / LAYERS) | 0
    const rem = N % LAYERS
    let idx = 0

    for (let l = 0; l < LAYERS; l++) {
        let remain = base + (l < rem ? 1 : 0)
        if (remain <= 0) continue

        const r = Rmin + (l + 0.5) * dr
        const arcs = Math.max(2, (SECTORS * (0.5 + Math.random() * 0.5)) | 0)
        const used = new Uint8Array(SECTORS)
        const typesHere = layerTypes[l]
        const kPerArc = Math.max(1, (remain / arcs) | 0)

        for (let a = 0; a < arcs && remain > 0; a++) {
            let s = (Math.random() * SECTORS) | 0
            while (used[s]) { s++; if (s === SECTORS) s = 0 }
            used[s] = 1

            const th0 = s * dth + dth * GAP
            const th1 = (s + 1 - GAP) * dth
            const arc = th1 - th0
            const k = Math.min(kPerArc, remain)
            const step = arc / k
            const start = th0 + Math.random() * step
            const c = Math.cos(step), sn = Math.sin(step)
            let ux = Math.cos(start), uy = Math.sin(start)
            const tType = typesHere[(Math.random() * typesHere.length) | 0]

            for (let j = 0; j < k; j++) {
                const rr = (Math.random() * 2 - 1) * THICK
                const x = cx + (r + rr) * ux
                const y = cy + (r + rr) * uy
                writeParticle(A, idx++, x, y, tType)
                const nx = ux * c - uy * sn
                uy = ux * sn + uy * c
                ux = nx
            }
            remain -= k
        }

        while (remain-- > 0) {
            const s = (Math.random() * SECTORS) | 0
            const ang = (s + Math.random()) * dth
            const rr = (Math.random() * 2 - 1) * THICK
            const x = cx + (r + rr) * Math.cos(ang)
            const y = cy + (r + rr) * Math.sin(ang)
            const tType = typesHere[(Math.random() * typesHere.length) | 0]
            writeParticle(A, idx++, x, y, tType)
        }
    }

    return A
}

export const chaoticBands: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const intersectLineRect = (cx: number, cy: number, ux: number, uy: number, minX: number, minY: number, maxX: number, maxY: number): { t0: number; t1: number } | null => {
        const ts: number[] = []; const EPS = 1e-8
        if (Math.abs(ux) > EPS) { ts.push((minX - cx) / ux, (maxX - cx) / ux) }
        if (Math.abs(uy) > EPS) { ts.push((minY - cy) / uy, (maxY - cy) / uy) }
        if (ts.length === 0) return null
        let t0 = Infinity, t1 = -Infinity
        for (let k = 0; k < ts.length; k++) {
            const t = ts[k], x = cx + ux * t, y = cy + uy * t
            if (x >= minX - 1e-6 && x <= maxX + 1e-6 && y >= minY - 1e-6 && y <= maxY + 1e-6) { if (t < t0) t0 = t; if (t > t1) t1 = t }
        }
        if (!isFinite(t0) || !isFinite(t1) || t1 <= t0) return null
        return { t0, t1 }
    }

    const lanesMin = Math.min(3, T)              // min lanes
    const lanesMax = Math.min(10, Math.max(3, T))// max lanes
    const ampMin = 0.005 * H                     // helix amplitude min
    const ampMax = 0.06 * H                      // helix amplitude max
    const tubeMin = 0.012 * Math.min(W, H)       // tube thickness min
    const tubeMax = 0.028 * Math.min(W, H)       // tube thickness max
    const edgeFrac = 0.18                        // edge scatter (0..1)
    const noise = 0.02 * Math.min(W, H)          // free noise
    const cyclesMin = 1.0                        // min cycles
    const cyclesMax = 3.0                        // max cycles
    const wobble = 0.2                           // secondary modulation factor
    const SAFE_PAD = 2                           // extra px safety

    const lanes = (lanesMin + Math.random() * (lanesMax - lanesMin + 1)) | 0
    const base = (N / lanes) | 0, rem = N % lanes

    const laneTypes: number[][] = Array.from({ length: lanes }, () => [])
    const types = Array.from({ length: T }, (_, t) => t)
    for (let i = T - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const tmp = types[i]; types[i] = types[j]; types[j] = tmp }
    for (let i = 0; i < T; i++) laneTypes[(Math.random() * lanes) | 0].push(types[i])
    for (let l = 0; l < lanes; l++) { const want = 1 + ((Math.random() * Math.min(4, T)) | 0); while (laneTypes[l].length < want) { const t = (Math.random() * T) | 0; if (!laneTypes[l].includes(t)) laneTypes[l].push(t) } }

    let i = 0
    for (let l = 0; l < lanes && i < N; l++) {
        let cnt = base + (l < rem ? 1 : 0); if (cnt <= 0) continue
        const theta = Math.random() * 2 * Math.PI, ux = Math.cos(theta), uy = Math.sin(theta), nx = -uy, ny = ux
        const amp = ampMin + Math.random() * (ampMax - ampMin), tube = tubeMin + Math.random() * (tubeMax - tubeMin)
        const maxOff = amp * (1 + wobble) + edgeFrac * tube + noise + SAFE_PAD
        const minX = maxOff, maxX = W - maxOff, minY = maxOff, maxY = H - maxOff
        if (minX >= maxX || minY >= maxY) break
        const cx = minX + Math.random() * (maxX - minX), cy = minY + Math.random() * (maxY - minY)
        const seg = intersectLineRect(cx, cy, ux, uy, minX, minY, maxX, maxY); if (!seg) continue
        const t0 = seg.t0, t1 = seg.t1, segLen = t1 - t0; if (segLen <= 1e-6) continue
        const cycles = cyclesMin + Math.random() * (cyclesMax - cyclesMin)
        const k = (2 * Math.PI * cycles) / segLen, phase = Math.random() * 2 * Math.PI, wobK = 2 * k, wobPhase = Math.random() * 2 * Math.PI
        const step = segLen / cnt; let t = t0 + Math.random() * step
        let baseX = cx + ux * t, baseY = cy + uy * t
        const dBX = ux * step, dBY = uy * step
        const a0 = k * (t - t0) + phase, da = k * step
        let sinA = Math.sin(a0), cosA = Math.cos(a0), cda = Math.cos(da), sda = Math.sin(da)
        const w0 = wobK * (t - t0) + wobPhase, dw = wobK * step
        let sinW = Math.sin(w0), cosW = Math.cos(w0), cdw = Math.cos(dw), sdw = Math.sin(dw)
        const typesHere = laneTypes[l]
        while (cnt-- > 0 && i < N) {
            const helix = amp * sinA, wobb = wobble * amp * sinW
            const edgeSign = Math.random() < 0.5 ? -1 : 1, edgeBias = 0.5 + 0.5 * Math.pow(Math.random(), 0.35)
            const offset = helix + wobb + edgeSign * edgeFrac * tube * edgeBias + (Math.random() * 2 - 1) * noise
            let x = baseX + nx * offset, y = baseY + ny * offset
            if (x < 0) x = 0; else if (x > W) x = W
            if (y < 0) y = 0; else if (y > H) y = H
            const type = typesHere[(Math.random() * typesHere.length) | 0]
            writeParticle(A, i++, x, y, type)
            baseX += dBX; baseY += dBY
            const sinA2 = sinA * cda + cosA * sda, cosA2 = cosA * cda - sinA * sda
            sinA = sinA2; cosA = cosA2
            const sinW2 = sinW * cdw + cosW * sdw, cosW2 = cosW * cdw - sinW * sdw
            sinW = sinW2; cosW = cosW2
        }
    }
    return A
}
export const orbitalBelts: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (T === 0) return A

    const R = 0.46 * Math.min(W, H) // outer radius
    const ecc = 0.35 // eccentricity
    const thick = 0.02 * R // belt thickness
    const minBelts = Math.min(4, T)
    const maxBelts = Math.min(8, T)
    const belts = Math.floor(minBelts + Math.random() * (maxBelts - minBelts + 1))
    const base = Math.floor(N / belts), rem = N % belts

    // Color distribution: each color appears in exactly one belt at least
    const types = Array.from({ length: T }, (_, t) => t)
    for (let i = T - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const tmp = types[i]; types[i] = types[j]; types[j] = tmp }
    const typesPerBelt: number[][] = Array.from({ length: belts }, () => [])
    const perBelt = Math.floor(T / belts)
    const extra = T % belts
    let idx = 0
    for (let b = 0; b < belts; b++) {
        const count = perBelt + (b < extra ? 1 : 0)
        for (let j = 0; j < count && idx < T; j++, idx++) typesPerBelt[b].push(types[idx])
    }
    while (idx < T) {
        typesPerBelt[(Math.random() * belts) | 0].push(types[idx++])
    }

    let i = 0
    for (let b = 0; b < belts; b++) {
        let k = base + (b < rem ? 1 : 0)
        const a = R * (0.25 + 0.7 * (b / Math.max(1, belts - 1)))
        const e = ecc * (0.6 + 0.8 * Math.random())
        const c = a * e
        const rot = Math.random() * 2 * Math.PI
        const C = Math.cos(rot), S = Math.sin(rot)
        const cx = W * 0.5 + c * C
        const cy = H * 0.5 + c * S
        const bAxis = a * Math.sqrt(1 - e * e)

        const beltTypes = typesPerBelt[b].length ? typesPerBelt[b] : [b % T]
        const dth = (2 * Math.PI) / Math.max(1, k)
        const cth = Math.cos(dth), sth = Math.sin(dth)
        let ux = Math.cos(Math.random() * 2 * Math.PI), uy = Math.sin(Math.random() * 2 * Math.PI)

        while (k-- > 0) {
            const rr = (Math.random() * 2 - 1) * thick
            const ex = (a + rr) * ux, ey = (bAxis + rr) * uy
            const x = cx + ex * C - ey * S
            const y = cy + ex * S + ey * C
            const type = beltTypes[(Math.random() * beltTypes.length) | 0]
            writeParticle(A, i++, x, y, type)
            const nx = ux * cth - uy * sth; uy = ux * sth + uy * cth; ux = nx
        }
    }
    return A
}
export const braidedBelts: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const R = 0.46 * Math.min(W, H) // outer radius
    const ecc = 0.36 // eccentricity
    const belts = Math.floor(2 + Math.random() * 4) // number of belts [2..5]
    const wavAmp = 0.06 * R // radial waviness
    const wavFreq = 4 // waves per revolution
    const thick = 0.018 * R // belt thickness

    const cx = W * 0.5, cy = H * 0.5
    const baseN = Math.floor(N / belts), remN = N % belts

    // assign each color to exactly one random belt; every color appears once globally
    const typesPerBelt: number[][] = Array.from({ length: belts }, () => [])
    if (T > 0) {
        const types = Array.from({ length: T }, (_, t) => t)
        for (let i = T - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const tmp = types[i]; types[i] = types[j]; types[j] = tmp }
        for (let idx = 0; idx < T; idx++) typesPerBelt[(Math.random() * belts) | 0].push(types[idx])
        for (let b = 0; b < belts; b++) if (typesPerBelt[b].length === 0) {
            let donor = -1
            for (let d = 0; d < belts; d++) if (typesPerBelt[d].length > 1) { donor = d; break }
            if (donor === -1) { const d = (b + 1) % belts; typesPerBelt[b].push(typesPerBelt[d].pop() ?? 0) }
            else typesPerBelt[b].push(typesPerBelt[donor].pop() as number)
        }
    }

    let i = 0
    for (let b = 0; b < belts; b++) {
        let k = baseN + (b < remN ? 1 : 0)
        const a = R * (0.55 + 0.35 * (b / Math.max(1, belts - 1)))
        const e = ecc
        const c = a * e
        const rot = Math.random() * (2 * Math.PI)
        const C = Math.cos(rot), S = Math.sin(rot)
        const x0 = cx + c * C, y0 = cy + c * S
        const bAxis = a * Math.sqrt(1 - e * e)

        const dth = 2 * Math.PI / Math.max(1, k)
        const ct = Math.cos(dth), st = Math.sin(dth)
        let th = Math.random() * 2 * Math.PI
        let ux = Math.cos(th), uy = Math.sin(th)

        const beltTypes = typesPerBelt[b]
        const M = Math.max(1, beltTypes.length)

        // build a mixed type sequence for this belt, evenly distributed then shuffled
        const baseC = Math.floor(k / M), remC = k % M
        const seq = new Int32Array(k)
        let p = 0
        for (let m = 0; m < M; m++) {
            const cnt = baseC + (m < remC ? 1 : 0)
            for (let t = 0; t < cnt; t++, p++) seq[p] = beltTypes[m]
        }
        // Fisher–Yates shuffle
        for (let s = k - 1; s > 0; s--) {
            const j = (Math.random() * (s + 1)) | 0
            const tmp = seq[s]; seq[s] = seq[j]; seq[j] = tmp
        }

        let idx = 0
        while (k-- > 0) {
            const w = wavAmp * Math.sin(wavFreq * th + b * Math.PI)
            const rr = (Math.random() * 2 - 1) * thick
            const ex = (a + w + rr) * ux
            const ey = (bAxis + rr) * uy
            const x = x0 + ex * C - ey * S
            const y = y0 + ex * S + ey * C
            writeParticle(A, i++, x, y, seq[idx++])
            const nx = ux * ct - uy * st; uy = ux * st + uy * ct; ux = nx
            th += dth
        }
    }

    return A
}
export const twinCrescents: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const m = Math.min(W, H)
    const cx = W * 0.5, cy = H * 0.5

    const R = 0.36 * m          // disc radius
    const SEP = 0.28 * m        // center separation

    const LEFT_FIRST = Math.random() < 0.5
    const c1x = cx - SEP * 0.5, c1y = cy
    const c2x = cx + SEP * 0.5, c2y = cy
    const R2 = R * R
    const TAU = 2 * Math.PI

    const types = Array.from({ length: T }, (_, t) => t)
    for (let i = T - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0
        const tmp = types[i]
        types[i] = types[j]
        types[j] = tmp
    }

    const mid = (T + 1) >> 1
    const groupA = types.slice(0, mid)
    const groupB = types.slice(mid)
    const leftTypes = LEFT_FIRST ? groupA : groupB
    const rightTypes = LEFT_FIRST ? groupB : groupA
    const ltLen = leftTypes.length || 1
    const rtLen = rightTypes.length || 1

    let leftCount = N >> 1
    let rightCount = N - leftCount
    let li = (Math.random() * ltLen) | 0
    let ri = (Math.random() * rtLen) | 0
    let idx = 0

    while (leftCount > 0 && idx < N) {
        const th = Math.random() * TAU
        const rr = R * Math.sqrt(Math.random())
        const x = c1x + rr * Math.cos(th)
        const y = c1y + rr * Math.sin(th)
        const dx = x - c2x, dy = y - c2y
        if (dx * dx + dy * dy < R2) continue
        writeParticle(A, idx++, x, y, leftTypes[li])
        li = (li + 1) % ltLen
        leftCount--
    }

    while (rightCount > 0 && idx < N) {
        const th = Math.random() * TAU
        const rr = R * Math.sqrt(Math.random())
        const x = c2x + rr * Math.cos(th)
        const y = c2y + rr * Math.sin(th)
        const dx = x - c1x, dy = y - c1y
        if (dx * dx + dy * dy < R2) continue
        writeParticle(A, idx++, x, y, rightTypes[ri])
        ri = (ri + 1) % rtLen
        rightCount--
    }

    while (idx < N) {
        const useLeft = Math.random() < 0.5
        const cx0 = useLeft ? c1x : c2x
        const cy0 = useLeft ? c1y : c2y
        const ox0 = useLeft ? c2x : c1x
        const oy0 = useLeft ? c2y : c1y
        const set = useLeft ? leftTypes : rightTypes
        const len = set.length || 1
        const sel = (Math.random() * len) | 0

        let x, y
        for (;;) {
            const th = Math.random() * TAU
            const rr = R * Math.sqrt(Math.random())
            x = cx0 + rr * Math.cos(th)
            y = cy0 + rr * Math.sin(th)
            const dx = x - ox0, dy = y - oy0
            if (dx * dx + dy * dy >= R2) break
        }
        writeParticle(A, idx++, x, y, set[sel])
    }

    return A
}
export const simpleFlower: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const PETALS_MIN = 2            // minimum petals
    const PETALS_MAX = 8            // maximum petals
    const R = 0.46 * Math.min(W, H) // max radius
    const JITTER = 0.02 * R         // radial noise

    const petals = PETALS_MIN + ((Math.random() * (PETALS_MAX - PETALS_MIN + 1)) | 0)
    const phase = Math.random() * 2 * Math.PI
    const cx = W * 0.5, cy = H * 0.5

    let t = 0
    for (let i = 0; i < N; i++) {
        const u = (i + Math.random()) / N
        const th = 2 * Math.PI * u + phase
        const rBase = Math.abs(Math.cos(petals * th)) * R
        const r = rBase + (Math.random() * 2 - 1) * JITTER
        const x = cx + r * Math.cos(th)
        const y = cy + r * Math.sin(th)
        writeParticle(A, i, x, y, t)
        t++; if (t === T) t = 0
    }

    return A
}
export const radiantFans: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (N <= 0 || T <= 0) return A

    const fans = Math.max(3, Math.min(10, T)) // number of fans
    const R = 0.46 * Math.min(W, H)           // outer radius
    const spread = 0.22 * Math.PI             // angular spread per fan
    const tail = 0.65                         // tail decay (0..1)
    const cx = W * 0.5, cy = H * 0.5

    // distribute colors across fans randomly, ensuring all colors appear
    const colorSets: number[][] = Array.from({ length: fans }, () => [])
    const types = Array.from({ length: T }, (_, i) => i)
    for (let i = T - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0
        const tmp = types[i]; types[i] = types[j]; types[j] = tmp
    }
    for (let i = 0; i < T; i++) colorSets[i % fans].push(types[i])

    const base = Math.floor(N / fans), rem = N % fans
    let i = 0
    for (let f = 0; f < fans; f++) {
        let k = base + (f < rem ? 1 : 0)
        const th0 = (f / fans) * (2 * Math.PI) + Math.random() * 0.2
        const cset = colorSets[f]
        const clen = cset.length || 1
        while (k-- > 0) {
            const u = Math.random()
            const r = R * (1 - Math.pow(1 - u, tail))
            const th = th0 + (Math.random() * 2 - 1) * spread
            const x = cx + r * Math.cos(th)
            const y = cy + r * Math.sin(th)
            const type = cset[(Math.random() * clen) | 0]
            writeParticle(A, i++, x, y, type)
        }
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
// === Registry & API ==================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
export const POSITIONS = [
    { id: 0,  name: 'Random',            generator: random },
    { id: 1,  name: 'Disk',              generator: disk },
    { id: 2,  name: 'Ring',              generator: ring },
    { id: 3,  name: 'Rings',             generator: rings },            // toDo: Randomize
    { id: 4,  name: 'Spiral',            generator: spiral },           // toDo: Randomize
    { id: 5,  name: 'Line',              generator: line },
    { id: 6,  name: 'Rainbow Disk',      generator: rainbowDisk },      // toDo: Randomize
    { id: 7,  name: 'Rainbow Ring',      generator: rainbowRing },      // toDo: Randomize
    { id: 8,  name: 'Rainbow Rings',     generator: rainbowRings },     // toDo: Randomize
    { id: 9,  name: 'Rainbow Spiral',    generator: rainbowSpiral },    // toDo: Randomize
    { id: 10, name: 'Rainbow Line',      generator: rainbowLine },
    { id: 11, name: 'Stripes',           generator: stripes },          // toDo: Randomize
    { id: 12, name: 'Border',            generator: border },
    { id: 13, name: 'Grid',              generator: grid },

    { id: 14, name: 'Wavy Bands',        generator: wavyBands },        // ~  Done
    { id: 15, name: 'Chaotic Bands',     generator: chaoticBands },     // ~  Done
    { id: 16, name: 'Simple Flower',     generator: simpleFlower },     // +  Done
    { id: 17, name: 'Chromatic Flower',  generator: chromaticFlower },  // +  Done
    { id: 18, name: 'Radiant Fans',      generator: radiantFans },      // ++  Done
    { id: 19, name: 'Yin–Yang',          generator: yinYang },          // +  Done
    { id: 20, name: 'Twin Crescents',    generator: twinCrescents },    // ++  Done
    { id: 21, name: 'Twin Spirals',      generator: twinSpirals },      // ++  Done
    { id: 22, name: 'Spiral Arms',       generator: spiralArms },       // ++  Done
    { id: 23, name: 'Soft Clusters',     generator: softClusters },     // +  toDo: improve nb clusters / fix missing colors / optimize (remove randN)
    { id: 24, name: 'Linked Clusters',   generator: linkedClusters },   // ++  toDo: improve nb clusters / fix missing colors / optimize (remove randN)
    { id: 25, name: 'Orbital Belts',     generator: orbitalBelts },     // +++  Done
    { id: 26, name: 'Braided Belts',     generator: braidedBelts },     // +++  Done
    { id: 27, name: 'Polar Maze',        generator: polarMaze },        // ++  Done
] as const

export const POSITION_OPTIONS: PositionOption[] = POSITIONS.map(({ id, name }) => ({ id, name }))

export function generatePositions(optionID: number, NUM_PARTICLES: number, NUM_TYPES: number, SIM_WIDTH: number, SIM_HEIGHT: number): ParticlesArray {
    const entry = POSITIONS.find(p => p.id === optionID)
    const gen = entry?.generator ?? random
    return gen(NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT)
}
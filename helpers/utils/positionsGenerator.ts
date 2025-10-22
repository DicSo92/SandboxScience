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
const perTypeCounts = (N: number, T: number): number[] => {
    const base = Math.floor(N / T), rem = N % T
    return Array.from({length:T}, (_,t)=> base + (t < rem ? 1 : 0))
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
    const maxR = 0.45 * Math.min(W, H)
    const n1 = Math.max(1, N - 1)
    const stepR = maxR / n1
    const dTheta = (turns * 2 * Math.PI) / n1
    const c = Math.cos(dTheta), s = Math.sin(dTheta)
    let ux = 1, uy = 0
    const j = 0.02 * maxR // thickness jitter

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
    const maxR = 0.45 * Math.min(W, H)
    const n1 = Math.max(1, N - 1)
    const stepR = maxR / n1
    const dTheta = (turns * 2 * Math.PI) / n1
    const c = Math.cos(dTheta), s = Math.sin(dTheta)
    let ux = 1, uy = 0
    const invTau = 1 / (2 * Math.PI)
    const dPhase = dTheta * invTau
    let phase = 0
    const j = 0.02 * maxR // thickness jitter

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
export const gaussianClusters: PosGen = (N, T, W, H) => {
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
// ---------------------------------------------------------------------------------------------------------------------
export const starburst: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const arms = Math.max(5, Math.min(16, T * 2))
    const maxR = 0.48 * Math.min(W, H)
    for (let i = 0; i < N; i++) {
        const arm = i % arms
        const t = Math.random()
        const r = t * maxR
        const th = (arm / arms) * Math.PI * 2 + randN(0, 0.04)
        writeParticle(A, i, cx + r * Math.cos(th), cy + r * Math.sin(th), i % T)
    }
    return A
}

export const twinGalaxies: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const arms = 2
    const maxR = 0.42 * Math.min(W, H)
    for (let i = 0; i < N; i++) {
        const arm = i % arms
        const t = (i / N)
        const th = (t * 4 * Math.PI + (arm ? Math.PI : 0))
        const r = Math.pow(t, 0.7) * maxR
        const jitter = 0.01 * Math.min(W, H)
        writeParticle(A, i, cx + r * Math.cos(th) + randN(0, jitter), cy + r * Math.sin(th) + randN(0, jitter), i % T)
    }
    return A
}

export const spiralArms: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N*5)
    const cx=W*0.5, cy=H*0.5, maxR=0.45*Math.min(W,H)
    const counts = perTypeCounts(N,T)
    let idx=0
    for (let t=0;t<T;t++){
        const turns = 2.5
        for (let j=0;j<counts[t]; j++,idx++){
            const u = (j+0.5)/counts[t]
            const th = u*turns*2*Math.PI + (t/T)*2*Math.PI
            const r  = Math.pow(u, 0.9)*maxR
            const jig = 0.01*Math.min(W,H)
            writeParticle(A, idx, cx + r*Math.cos(th)+randN(0,jig), cy + r*Math.sin(th)+randN(0,jig), t)
        }
    }
    return A
}

export const yinYang: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N*5)
    const cx=W*0.5, cy=H*0.5, R=0.42*Math.min(W,H)
    const two = Math.max(2, T)
    for (let i=0;i<N;i++){
        const th = Math.random()*2*Math.PI
        const r  = Math.sqrt(Math.random())*R
        const x = cx + r*Math.cos(th), y = cy + r*Math.sin(th)
        // type selon demi-cercle + bulle yin/yang
        const left = (Math.cos(th) < 0)
        let type = left ? 0 : 1
        if (T>2) type = (type + Math.floor(Math.random()*(two-1))) % T
        writeParticle(A, i, x, y, type)
    }
    return A
}

export const polarFlowers: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N*5)
    const cx=W*0.5, cy=H*0.5, R=0.46*Math.min(W,H)
    const counts = perTypeCounts(N,T)
    const k = 3 + (T % 4)
    let idx=0
    for (let t=0;t<T;t++){
        const phi = (t/T)*Math.PI*2
        for (let j=0;j<counts[t]; j++,idx++){
            const th = Math.random()*2*Math.PI
            const r  = Math.abs(Math.cos(k*th + phi)) * R
            const jig = 0.008*Math.min(W,H)
            writeParticle(A, idx, cx + r*Math.cos(th)+randN(0,jig), cy + r*Math.sin(th)+randN(0,jig), t)
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
export const clusterWeb: PosGen = (N, T, W, H) => {
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

    // edges: undirected nearest-neighbour plus a few extras
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

    // gaussian cores
    let i = 0
    for (let n = 0; n < coreN; n++, i++) {
        const cluster = n % k
        const [cx, cy] = centers[cluster]
        const x = cx + randN(0, sigma)
        const y = cy + randN(0, sigma)
        writeParticle(A, i, x, y, cluster % T)
    }
    if (bridges === 0 || edges.length === 0) return A

    // helpers for blend zone (deterministic banding in the center)
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

    // leftovers
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
export const polarMaze: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const Rmin = 0.12 * Math.min(W, H) // inner radius
    const Rmax = 0.46 * Math.min(W, H) // outer radius
    const LAYERS = 5                   // number of rings
    const SECTORS = 16                 // sectors per ring
    const GAP_SPAN = 2.5                 // consecutive empty sectors per ring
    const THICK = 0.01 * Math.min(W, H) // arc thickness

    // weights by circumference
    const w = new Float32Array(LAYERS)
    let ws = 0
    for (let l = 0; l < LAYERS; l++) { const r = Rmin + (l + 0.5) * (Rmax - Rmin) / LAYERS; w[l] = r; ws += r }

    const counts = new Int32Array(LAYERS)
    let acc = 0
    for (let l = 0; l < LAYERS; l++) { counts[l] = Math.max(1, Math.floor((w[l] / ws) * N)); acc += counts[l] }
    while (acc > N) { for (let l = LAYERS - 1; l >= 0 && acc > N; l--) { if (counts[l] > 1) { counts[l]--; acc-- } } }
    while (acc < N) { for (let l = 0; l < LAYERS && acc < N; l++) { counts[l]++; acc++ } }

    const twopi = 2 * Math.PI
    const sectorSize = twopi / SECTORS

    let i = 0, type = 0
    for (let l = 0; l < LAYERS; l++) {
        let kLayer = counts[l]
        const r = Rmin + (l + 0.5) * (Rmax - Rmin) / LAYERS
        const gapStart = (Math.random() * SECTORS) | 0
        const activeSectors = SECTORS - GAP_SPAN
        if (activeSectors <= 0) continue
        const perSector = Math.max(1, Math.floor(kLayer / activeSectors))

        for (let s = 0; s < SECTORS && kLayer > 0; s++) {
            const inGap = ((s - gapStart + SECTORS) % SECTORS) < GAP_SPAN
            if (inGap) continue

            const th0 = s * sectorSize
            const th1 = (s + 1) * sectorSize
            const arcLen = th1 - th0
            const k = Math.min(perSector, kLayer)
            const dth = arcLen / k
            const start = th0 + dth * Math.random()
            const c = Math.cos(dth), sng = Math.sin(dth)
            let ux = Math.cos(start), uy = Math.sin(start)

            for (let j = 0; j < k && kLayer > 0; j++) {
                const off = (Math.random() * 2 - 1) * THICK
                const x = cx + (r + off) * ux
                const y = cy + (r + off) * uy
                writeParticle(A, i++, x, y, type)
                type++; if (type === T) type = 0
                const nx = ux * c - uy * sng
                uy = ux * sng + uy * c
                ux = nx
                kLayer--
            }
        }
    }
    return A
}
export const helixField: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const lanes = Math.max(2, Math.min(6, T)) // number of helices
    const amp = 0.28 * H // helix amplitude
    const freq = 1.2 // helix frequency (cycles across width)
    const thickness = 0.02 * H // tube thickness

    const base = Math.floor(N / lanes), rem = N % lanes
    const kx = (2 * Math.PI * freq) / Math.max(1, W)

    let i = 0
    for (let l = 0; l < lanes; l++) {
        let cnt = base + (l < rem ? 1 : 0)
        const y0 = (l + 0.5) * (H / lanes)
        const phase = (l / lanes) * 2 * Math.PI
        const type = l % T
        while (cnt-- > 0) {
            const x = Math.random() * W
            const y = y0 + amp * Math.sin(kx * x + phase) + (Math.random() * 2 - 1) * thickness
            writeParticle(A, i++, x, y, type)
        }
    }
    return A
}
export const orbitalBelts: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    if (T === 0) return A

    const R = 0.46 * Math.min(W, H)           // outer radius
    const ecc = 0.35                           // eccentricity
    const thick = 0.02 * R                     // belt thickness
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
    const R = 0.46 * Math.min(W, H)                  // outer radius
    const ecc = 0.36                                 // eccentricity
    const belts = Math.floor(2 + Math.random() * 4)  // number of belts [2..5]
    const wavAmp = 0.06 * R                          // radial waviness
    const wavFreq = 4                                // waves per revolution
    const thick = 0.018 * R                          // belt thickness

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
export const crescentFields: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const m = Math.min(W, H)
    const r = 0.34 * m                 // disc radius
    const offset = 0.28 * m            // center separation
    const cx = W * 0.5, cy = H * 0.5
    const c1x = cx - offset * 0.5, c1y = cy
    const c2x = cx + offset * 0.5, c2y = cy
    for (let i = 0, t = 0; i < N; i++) {
        let x: number, y: number
        if (i & 1) {
            const th = Math.random() * 2 * Math.PI
            const rr = r * Math.sqrt(Math.random())
            x = c1x + rr * Math.cos(th); y = c1y + rr * Math.sin(th)
            const d2 = (x - c2x) ** 2 + (y - c2y) ** 2
            if (d2 < r * r) { i--; continue }
        } else {
            const th = Math.random() * 2 * Math.PI
            const rr = r * Math.sqrt(Math.random())
            x = c2x + rr * Math.cos(th); y = c2y + rr * Math.sin(th)
            const d1 = (x - c1x) ** 2 + (y - c1y) ** 2
            if (d1 < r * r) { i--; continue }
        }
        writeParticle(A, i, x, y, t)
        t++; if (t === T) t = 0
    }
    return A
}
export const rosettePetals: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N*5)
    const petals = Math.max(3, Math.min(9, T)) // number of petals
    const R = 0.46 * Math.min(W,H)             // max radius
    const jitter = 0.02 * R                     // radial thickness
    const cx=W*0.5, cy=H*0.5

    for(let i=0,t=0;i<N;i++){
        const u = (i+Math.random())/N
        const th = 2*Math.PI*u
        const r0 = Math.abs(Math.cos(petals*th)) * R
        const r = Math.max(0, r0 + (Math.random()*2-1)*jitter)
        const x = cx + r*Math.cos(th)
        const y = cy + r*Math.sin(th)
        writeParticle(A, i, x, y, t)
        t++; if(t===T) t=0
    }
    return A
}
export const cometFans: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N*5)
    const fans = Math.max(3, Math.min(10, T)) // number of fans
    const R = 0.46 * Math.min(W,H)            // outer radius
    const spread = 0.28 * Math.PI             // angular spread per fan
    const tail = 0.65                          // tail decay (0..1)
    const cx=W*0.5, cy=H*0.5

    const base = Math.floor(N/fans), rem = N%fans
    let i=0
    for(let f=0; f<fans; f++){
        let k = base + (f<rem?1:0)
        const th0 = (f/fans)*2*Math.PI + Math.random()*0.2
        const type = f % T
        while(k-- > 0){
            const u = Math.random()
            const r = R*(1 - Math.pow(1-u, tail))
            const th = th0 + (Math.random()*2-1)*spread
            const x = cx + r*Math.cos(th)
            const y = cy + r*Math.sin(th)
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
    { id: 3,  name: 'Rings',             generator: rings },
    { id: 4,  name: 'Spiral',            generator: spiral },
    { id: 5,  name: 'Line',              generator: line },
    { id: 6,  name: 'Rainbow Disk',      generator: rainbowDisk },
    { id: 7,  name: 'Rainbow Ring',      generator: rainbowRing },
    { id: 8,  name: 'Rainbow Rings',     generator: rainbowRings },
    { id: 9,  name: 'Rainbow Spiral',    generator: rainbowSpiral },
    { id: 10, name: 'Rainbow Line',      generator: rainbowLine },
    { id: 11, name: 'Stripes',           generator: stripes },
    { id: 12, name: 'Border',            generator: border },
    { id: 13, name: 'Grid',              generator: grid },

    { id: 15, name: 'Starburst',         generator: starburst },
    { id: 17, name: 'Twin Galaxies',     generator: twinGalaxies },
    { id: 18, name: 'Spiral Arms',       generator: spiralArms },
    { id: 19, name: 'Yin–Yang',          generator: yinYang },
    { id: 20, name: 'Polar Flowers',     generator: polarFlowers },

    { id: 21, name: 'Wavy Bands',        generator: wavyBands },        // +
    { id: 14, name: 'Gaussian Clusters', generator: gaussianClusters }, // +
    { id: 23, name: 'Cluster Web',       generator: clusterWeb },       // ++
    { id: 24, name: 'Polar Maze',        generator: polarMaze },        // ~
    { id: 25, name: 'Helix Field',       generator: helixField },       // --
    { id: 26, name: 'Orbital Belts',     generator: orbitalBelts },     // +++
    { id: 27, name: 'Braided Belts',     generator: braidedBelts },     // ++++
    { id: 28, name: 'Crescent Fields',   generator: crescentFields },   // ~
    { id: 29, name: 'Rosette Petals',    generator: rosettePetals },    // ~
    { id: 30, name: 'Comet Fans',        generator: cometFans },        // ++
] as const

export const POSITION_OPTIONS: PositionOption[] = POSITIONS.map(({ id, name }) => ({ id, name }))

export function generatePositions(optionID: number, NUM_PARTICLES: number, NUM_TYPES: number, SIM_WIDTH: number, SIM_HEIGHT: number): ParticlesArray {
    const entry = POSITIONS.find(p => p.id === optionID)
    const gen = entry?.generator ?? random
    return gen(NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT)
}
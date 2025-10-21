export interface PositionOption { id: number; name: string }
type ParticlesArray = Float32Array
type PosGen = (NUM_PARTICLES: number, NUM_TYPES: number, SIM_WIDTH: number, SIM_HEIGHT: number) => ParticlesArray

// ---------------------------------------------------------------------------------------------------------------------
// ==== HELPERS ========================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
const put = (arr: Float32Array, i: number, x: number, y: number, type: number) => {
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
        const k = i * 5
        A[k    ] = Math.random() * SIM_WIDTH
        A[k + 1] = Math.random() * SIM_HEIGHT
        A[k + 2] = 0
        A[k + 3] = 0
        A[k + 4] = t
        t++; if (t === NUM_TYPES) t = 0
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const disk: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const R = 0.4 * Math.min(W, H) // disk radius

    let t = 0
    for (let i = 0; i < N; i++) {
        const k = i * 5
        const th = Math.random() * 6.28318530718
        const r = Math.sqrt(Math.random()) * R
        const c = Math.cos(th), s = Math.sin(th)
        A[k    ] = cx + r * c
        A[k + 1] = cy + r * s
        A[k + 2] = 0
        A[k + 3] = 0
        A[k + 4] = t
        t++; if (t === T) t = 0
    }
    return A
}
export const rainbowDisk: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const R = 0.4 * Math.min(W, H) // disk radius
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
            const idx = i * 5
            const r = Math.sqrt(Math.random()) * R
            A[idx    ] = cx + r * ux
            A[idx + 1] = cy + r * uy
            A[idx + 2] = 0
            A[idx + 3] = 0
            A[idx + 4] = t
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
        const k = i * 5
        const rr = R + (Math.random() * 2 - 1) * thick
        A[k    ] = cx + rr * ux
        A[k + 1] = cy + rr * uy
        A[k + 2] = 0
        A[k + 3] = 0
        A[k + 4] = t
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
        const th0 = t * sector
        const dth = sector / k
        const off = Math.random()
        const start = th0 + dth * off
        const c = Math.cos(dth), s = Math.sin(dth)
        let ux = Math.cos(start), uy = Math.sin(start)

        for (let j = 0; j < k; j++, i++) {
            const idx = i * 5
            const rr = R + (Math.random() * 2 - 1) * thick
            A[idx    ] = cx + rr * ux
            A[idx + 1] = cy + rr * uy
            A[idx + 2] = 0
            A[idx + 3] = 0
            A[idx + 4] = t
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
            const idx = i * 5
            const th = twopi * ((j + Math.random()) / k)
            const rr = R + (Math.random() * 2 - 1) * thick
            A[idx    ] = cx + rr * Math.cos(th)
            A[idx + 1] = cy + rr * Math.sin(th)
            A[idx + 2] = 0
            A[idx + 3] = 0
            A[idx + 4] = t
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
            const idx = i * 5
            const th = twopi * ((j + Math.random()) / k)
            const rr = r + (Math.random() * 2 - 1) * thick
            A[idx    ] = cx + rr * Math.cos(th)
            A[idx + 1] = cy + rr * Math.sin(th)
            A[idx + 2] = 0
            A[idx + 3] = 0
            A[idx + 4] = t
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
        const k = i * 5
        const r = i * stepR
        A[k    ] = cx + r * ux + (Math.random() * 2 - 1) * j // x
        A[k + 1] = cy + r * uy + (Math.random() * 2 - 1) * j // y
        A[k + 2] = 0
        A[k + 3] = 0
        A[k + 4] = tType
        const nx = ux * c - uy * s
        uy = ux * s + uy * c
        ux = nx
        tType++
        if (tType === T) tType = 0
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

    const j = 0.015 * maxR
    for (let i = 0; i < N; i++) {
        const k = i * 5
        const r = i * stepR
        A[k    ] = cx + r * ux + (Math.random() * 2 - 1) * j
        A[k + 1] = cy + r * uy + (Math.random() * 2 - 1) * j
        A[k + 2] = 0
        A[k + 3] = 0
        const tType = Math.floor(phase * T)
        A[k + 4] = tType
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
    const thickness = H * 0.1 // jitter thickness (10% of height)
    const xStart = cx - L * 0.5
    const step = N > 1 ? L / (N - 1) : 0

    let t = 0
    for (let i = 0; i < N; i++) {
        const k = i * 5
        const x = xStart + step * i
        const y = cy + (Math.random() - 0.5) * thickness
        A[k    ] = x
        A[k + 1] = y
        A[k + 2] = 0
        A[k + 3] = 0
        A[k + 4] = t
        t++
        if (t === T) t = 0
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
            const idx = i * 5
            const x = x0 + segW * ((j + Math.random()) / k)
            const y = cy + (Math.random() - 0.5) * thickness

            A[idx    ] = x
            A[idx + 1] = y
            A[idx + 2] = 0
            A[idx + 3] = 0
            A[idx + 4] = t
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
            const k5 = i * 5
            A[k5    ] = x0 + Math.random() * segW
            A[k5 + 1] = Math.random() * H
            A[k5 + 2] = 0
            A[k5 + 3] = 0
            A[k5 + 4] = t
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
        const k = i * 5
        const s = i * step
        let x: number, y: number

        if (s < L0) { x = inset + s; y = inset }
        else if (s < L1) { x = inset + w; y = inset + (s - L0) }
        else if (s < L2) { x = inset + (L2 - s); y = inset + h }
        else { x = inset; y = inset + (P - s) }

        A[k    ] = x
        A[k + 1] = y
        A[k + 2] = 0
        A[k + 3] = 0
        A[k + 4] = t
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
            const k = i * 5
            const x = x0 + (c + 0.5) * dx
            A[k    ] = x
            A[k + 1] = y
            A[k + 2] = 0
            A[k + 3] = 0
            A[k + 4] = t
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
        centers.push([W * (margin + Math.random() * (1 - 2 * margin)),
            H * (margin + Math.random() * (1 - 2 * margin))])
    }
    const sigma = 0.06 * Math.min(W, H)
    for (let i = 0; i < N; i++) {
        const cluster = i % k
        const [cx, cy] = centers[cluster]
        const x = cx + randN(0, sigma)
        const y = cy + randN(0, sigma)
        put(A, i, x, y, i % T)
    }
    return A
}

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
        put(A, i, cx + r * Math.cos(th), cy + r * Math.sin(th), i % T)
    }
    return A
}

export const lissajous: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N * 5)
    const cx = W * 0.5, cy = H * 0.5
    const ax = 3, ay = 2 // co-premiers pour une belle boucle
    const RX = 0.45 * W, RY = 0.45 * H
    const phase = Math.random() * Math.PI
    for (let i = 0; i < N; i++) {
        const t = (i / N) * 2 * Math.PI
        const x = cx + RX * Math.cos(ax * t + phase) + randN(0, W * 0.002)
        const y = cy + RY * Math.sin(ay * t) + randN(0, H * 0.002)
        put(A, i, x, y, i % T)
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
        put(A, i, cx + r * Math.cos(th) + randN(0, jitter), cy + r * Math.sin(th) + randN(0, jitter), i % T)
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
            put(A, idx, cx + r*Math.cos(th)+randN(0,jig), cy + r*Math.sin(th)+randN(0,jig), t)
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
        put(A, i, x, y, type)
    }
    return A
}

export const polarFlowers: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N*5)
    const cx=W*0.5, cy=H*0.5, R=0.46*Math.min(W,H)
    const counts = perTypeCounts(N,T)
    const k = 3 + (T % 4)             // pétales
    let idx=0
    for (let t=0;t<T;t++){
        const phi = (t/T)*Math.PI*2
        for (let j=0;j<counts[t]; j++,idx++){
            const th = Math.random()*2*Math.PI
            const r  = Math.abs(Math.cos(k*th + phi)) * R
            const jig = 0.008*Math.min(W,H)
            put(A, idx, cx + r*Math.cos(th)+randN(0,jig), cy + r*Math.sin(th)+randN(0,jig), t)
        }
    }
    return A
}

export const wavyBands: PosGen = (N, T, W, H) => {
    const A = new Float32Array(N*5)
    const counts = perTypeCounts(N,T)
    const amp = 0.06*H, k = 2*Math.PI/W * (1 + (T%3))
    let idx=0
    for (let t=0;t<T;t++){
        for (let j=0;j<counts[t]; j++,idx++){
            const x = Math.random()*W
            const y0 = (t+0.5)*(H/T)
            const y = y0 + amp*Math.sin(k*x + t*0.7) + randN(0, 0.01*H)
            put(A, idx, x, Math.max(0, Math.min(H, y)), t)
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

    { id: 14, name: 'Gaussian Clusters', generator: gaussianClusters },
    { id: 15, name: 'Starburst',         generator: starburst },
    { id: 16, name: 'Lissajous Loop',    generator: lissajous },
    { id: 17, name: 'Twin Galaxies',     generator: twinGalaxies },
    { id: 18, name: 'Spiral Arms',       generator: spiralArms },
    { id: 19, name: 'Yin–Yang',          generator: yinYang },
    { id: 20, name: 'Polar Flowers',     generator: polarFlowers },
    { id: 21, name: 'Wavy Bands',        generator: wavyBands },
] as const

export const POSITION_OPTIONS: PositionOption[] = POSITIONS.map(({ id, name }) => ({ id, name }))

export function generatePositions(optionID: number, NUM_PARTICLES: number, NUM_TYPES: number, SIM_WIDTH: number, SIM_HEIGHT: number): ParticlesArray {
    const entry = POSITIONS.find(p => p.id === optionID)
    const gen = entry?.generator ?? random
    return gen(NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT)
}
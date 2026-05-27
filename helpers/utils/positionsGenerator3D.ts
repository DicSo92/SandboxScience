export interface PositionOption { id: number; name: string, category?: string }
type ParticlesArray = Float32Array
type PosGen = (NUM_PARTICLES: number, NUM_TYPES: number, SIM_WIDTH: number, SIM_HEIGHT: number, SIM_DEPTH: number) => ParticlesArray

// ---------------------------------------------------------------------------------------------------------------------
// ==== HELPERS ========================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
const writeParticle = (arr: Float32Array, i: number, x: number, y: number, z: number, type: number) => {
    const k = i * 7
    arr[k] = x
    arr[k + 1] = y
    arr[k + 2] = z
    arr[k + 3] = 0 // vx
    arr[k + 4] = 0 // vy
    arr[k + 5] = 0 // vz
    arr[k + 6] = type
}
// ---------------------------------------------------------------------------------------------------------------------
const TAU = 6.28318530718
const getSpawnRadius = (W: number, H: number, D: number) => 0.46 * Math.min(W, H, D)
const sampleSphereDirection = () => {
    const phi = Math.random() * TAU
    const u = Math.random() * 2 - 1
    const s = Math.sqrt(1 - u * u)
    return { x: s * Math.cos(phi), y: s * Math.sin(phi), z: u }
}
// ---------------------------------------------------------------------------------------------------------------------
// ==== GENERATORS =====================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
export const random: PosGen = (NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT, SIM_DEPTH: number) => {
    const A = new Float32Array(NUM_PARTICLES * 7)
    let t = 0
    for (let i = 0; i < NUM_PARTICLES; i++) {
        const x = Math.random() * SIM_WIDTH
        const y = Math.random() * SIM_HEIGHT
        const z = Math.random() * SIM_DEPTH
        writeParticle(A, i, x, y, z, t)
        t++; if (t === NUM_TYPES) t = 0
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
export const sphere: PosGen = (N, T, W, H, D) => {
    const A = new Float32Array(N * 7)
    const cx = W * 0.5, cy = H * 0.5, cz = D * 0.5
    const R = getSpawnRadius(W, H, D)
    let t = 0
    for (let i = 0; i < N; i++) {
        const dir = sampleSphereDirection()
        const r = Math.cbrt(Math.random()) * R
        const x = cx + r * dir.x
        const y = cy + r * dir.y
        const z = cz + r * dir.z
        writeParticle(A, i, x, y, z, t)
        t++; if (t === T) t = 0
    }
    return A
}
export const sphereSurface: PosGen = (N, T, W, H, D) => {
    const A = new Float32Array(N * 7)
    const cx = W * 0.5, cy = H * 0.5, cz = D * 0.5
    const R = getSpawnRadius(W, H, D)
    let t = 0
    for (let i = 0; i < N; i++) {
        const dir = sampleSphereDirection()
        const x = cx + R * dir.x
        const y = cy + R * dir.y
        const z = cz + R * dir.z
        writeParticle(A, i, x, y, z, t)
        t++; if (t === T) t = 0
    }
    return A
}
export const sphereShell: PosGen = (N, T, W, H, D) => {
    const A = new Float32Array(N * 7)
    const cx = W * 0.5, cy = H * 0.5, cz = D * 0.5
    const R = getSpawnRadius(W, H, D)
    const innerRadius = R * 0.85
    let t = 0
    for (let i = 0; i < N; i++) {
        const dir = sampleSphereDirection()
        const rr3 = innerRadius ** 3 + Math.random() * (R ** 3 - innerRadius ** 3)
        const r = Math.cbrt(rr3)
        const x = cx + r * dir.x
        const y = cy + r * dir.y
        const z = cz + r * dir.z
        writeParticle(A, i, x, y, z, t)
        t++; if (t === T) t = 0
    }
    return A
}
export const cube: PosGen = (N, T, W, H, D) => {
    const A = new Float32Array(N * 7)
    const cx = W * 0.5, cy = H * 0.5, cz = D * 0.5
    const half = getSpawnRadius(W, H, D)
    let t = 0
    for (let i = 0; i < N; i++) {
        const x = cx + (Math.random() * 2 - 1) * half
        const y = cy + (Math.random() * 2 - 1) * half
        const z = cz + (Math.random() * 2 - 1) * half
        writeParticle(A, i, x, y, z, t)
        t++; if (t === T) t = 0
    }
    return A
}
export const cubeSurface: PosGen = (N, T, W, H, D) => {
    const A = new Float32Array(N * 7)
    const cx = W * 0.5, cy = H * 0.5, cz = D * 0.5
    const half = getSpawnRadius(W, H, D)
    
    let t = 0
    for (let i = 0; i < N; i++) {
        let x = (Math.random() * 2 - 1) * half
        let y = (Math.random() * 2 - 1) * half
        let z = (Math.random() * 2 - 1) * half
        const axis = (Math.random() * 3) | 0
        const face = Math.random() < 0.5 ? -half : half
        
        if (axis === 0) x = face
        else if (axis === 1) y = face
        else z = face
        
        writeParticle(A, i, cx + x, cy + y, cz + z, t)
        t++; if (t === T) t = 0
    }
    return A
}
export const torus: PosGen = (N, T, W, H, D) => {
    const A = new Float32Array(N * 7)
    const cx = W * 0.5, cy = H * 0.5, cz = D * 0.5
    const m = Math.min(W, H, D)
    const majorRadius = 0.3 * m
    const tubeRadius = 0.1 * m

    let t = 0
    for (let i = 0; i < N; i++) {
        const phi = Math.random() * TAU
        const theta = Math.random() * TAU
        const r = Math.sqrt(Math.random()) * tubeRadius
        const localR = majorRadius + r * Math.cos(theta)
        const x = cx + localR * Math.cos(phi)
        const y = cy + localR * Math.sin(phi)
        const z = cz + r * Math.sin(theta)
        writeParticle(A, i, x, y, z, t)
        t++; if (t === T) t = 0
    }
    return A
}
// ---------------------------------------------------------------------------------------------------------------------
// === Registry & API ==================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
export const POSITIONS = [
    { id: 0,  name: 'Random', category: 'Default',              generator: random },
    { id: 1,  name: 'Sphere', category: 'Classic',              generator: sphere },
    { id: 2,  name: 'Sphere Surface', category: 'Classic',      generator: sphereSurface },
    { id: 3,  name: 'Sphere Shell', category: 'Classic',        generator: sphereShell },
    { id: 4,  name: 'Cube', category: 'Geometric',              generator: cube },
    { id: 5,  name: 'Cube Surface', category: 'Geometric',      generator: cubeSurface },
    { id: 6,  name: 'Torus', category: 'Geometric',             generator: torus },
] as const

export const POSITION_OPTIONS: PositionOption[] = POSITIONS.map(({ id, name, category }) => ({ id, name, category }))

export function generatePositions(optionID: number, NUM_PARTICLES: number, NUM_TYPES: number, SIM_WIDTH: number, SIM_HEIGHT: number, SIM_DEPTH: number): ParticlesArray {
    const entry = POSITIONS.find(p => p.id === optionID)
    const gen = entry?.generator ?? random
    return gen(NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT, SIM_DEPTH)
}
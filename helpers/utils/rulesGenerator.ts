export interface RuleOption { id: number; name: string; category?: string }
export type Matrix = number[][]

export function makeRandomRulesMatrix(NUM_TYPES: number): Matrix {
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            m[i][j] = Math.random() * 2 - 1 // valeurs dans [-1, 1)
        }
    }
    return m
}

export function symmetricGenerator(NUM_TYPES: number): Matrix {
    const m = makeRandomRulesMatrix(NUM_TYPES)
    for (let i = 0; i < NUM_TYPES; i++) {
        for (let j = i + 1; j < NUM_TYPES; j++) {
            m[j][i] = m[i][j]
        }
    }
    return m
}

export function snakeGenerator(NUM_TYPES: number): Matrix {
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (j === i) m[i][j] = 1
            else if (j === (i + 1) % NUM_TYPES) m[i][j] = 0.2
            else m[i][j] = 0
        }
    }
    return m
}

export function chains1Generator(NUM_TYPES: number): Matrix {
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (j === i || j === (i + 1) % NUM_TYPES || j === (i + NUM_TYPES - 1) % NUM_TYPES) m[i][j] = 1
            else m[i][j] = -1
        }
    }
    return m
}

export function chains2Generator(NUM_TYPES: number): Matrix {
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (j === i) m[i][j] = 1
            else if (j === (i + 1) % NUM_TYPES || j === (i + NUM_TYPES - 1) % NUM_TYPES) m[i][j] = 0.2
            else m[i][j] = -1
        }
    }
    return m
}

export function chains3Generator(NUM_TYPES: number): Matrix {
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (j === i) m[i][j] = 1
            else if (j === (i + 1) % NUM_TYPES || j === (i + NUM_TYPES - 1) % NUM_TYPES) m[i][j] = 0.2
            else m[i][j] = 0
        }
    }
    return m
}

export function rockPaperScissorsGenerator(NUM_TYPES: number): Matrix {
    const A = 0.9, R = -0.7, S = -0.1
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (j === i) m[i][j] = S
            else if (j === (i + 1) % NUM_TYPES) m[i][j] = A
            else if (j === (i + NUM_TYPES - 1) % NUM_TYPES) m[i][j] = R
            else m[i][j] = 0
        }
    }
    return m
}

export function bipartiteGenerator(NUM_TYPES: number): Matrix {
    const INTRA = 0.8, INTER = -0.8, S = 0.2
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            const sameBloc = (i % 2) === (j % 2)
            m[i][j] = j === i ? S : (sameBloc ? INTRA : INTER)
        }
    }
    return m
}

export function hubAndSpokesGenerator(NUM_TYPES: number): Matrix {
    const CORE = 0, INTRA = 0.0, TO_CORE = 1.0, FROM_CORE = 0.6
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) m[i][j] = CORE
            else if (i === 0) m[i][j] = TO_CORE
            else if (j === 0) m[i][j] = FROM_CORE
            else m[i][j] = INTRA
        }
    }
    return m
}

export function concentricShellsGenerator(NUM_TYPES: number): Matrix {
    const SELF = 0.9, NEXT = 0.3, FAR = -0.6
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (j === i) m[i][j] = SELF
            else if (j === (i + 1) % NUM_TYPES) m[i][j] = NEXT
            else m[i][j] = FAR
        }
    }
    return m
}

export function antiSymmetricSwirlGenerator(NUM_TYPES: number): Matrix {
    const BASE = 0.7
    const m: Matrix = Array.from({ length: NUM_TYPES }, () => Array(NUM_TYPES).fill(0))
    for (let i = 0; i < NUM_TYPES; i++) {
        for (let j = i + 1; j < NUM_TYPES; j++) {
            const val = ((j - i + NUM_TYPES) % NUM_TYPES) <= (NUM_TYPES / 2) ? BASE : -BASE
            m[i][j] = val
            m[j][i] = -val
        }
        m[i][i] = -0.05
    }
    return m
}

export function checkerOffsetsGenerator(NUM_TYPES: number): Matrix {
    const NEI = -0.8, SKIP = 0.8, SELF = 0.2
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (j === i) m[i][j] = SELF
            else if (j === (i + 1) % NUM_TYPES || j === (i + NUM_TYPES - 1) % NUM_TYPES) m[i][j] = NEI
            else if (j === (i + 2) % NUM_TYPES || j === (i + NUM_TYPES - 2) % NUM_TYPES) m[i][j] = SKIP
            else m[i][j] = 0
        }
    }
    return m
}

export function dimersAndChainsGenerator(NUM_TYPES: number): Matrix {
    const STRONG = 1.0, REP = -0.9, SELF = 0
    const partner = (t: number) => t ^ 1 // 0↔1, 2↔3, ...
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (j === i) m[i].push(SELF)
            else if (j === partner(i)) m[i].push(STRONG)
            else m[i].push(REP)
        }
    }
    return m
}

export function triadFlocksGenerator(NUM_TYPES: number): Matrix {
    const IN = 0.9, OUT = -0.7, SELF = 0.1
    const groupId = (t: number) => Math.floor(t / 3)
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) m[i].push(SELF)
            else m[i].push(groupId(i) === groupId(j) ? IN : OUT)
        }
    }
    return m
}

export function spiralConveyorGenerator(NUM_TYPES: number): Matrix {
    const A1 = 0.7, A2 = 0.3, R = -0.6, SELF = -0.1
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (j === i) m[i].push(SELF)
            else if (j === (i + 1) % NUM_TYPES) m[i].push(A1)
            else if (j === (i + 2) % NUM_TYPES) m[i].push(A2)
            else m[i].push(R)
        }
    }
    return m
}

export function patchworkGenerator(NUM_TYPES: number): Matrix {
    const p = 0.35, POS = 0.9, NEG = -0.9, SELF = 0.0
    const rnd = (i: number, j: number) => Math.abs((Math.sin(i * 73856093 ^ j * 19349663) * 43758.5453) % 1)
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) m[i].push(SELF)
            else {
                const r = rnd(i, j)
                m[i].push(r < p ? POS : (r < 2 * p ? NEG : 0))
            }
        }
    }
    return m
}

export function wavefieldGenerator(NUM_TYPES: number): Matrix {
    const AMP = 0.9, SELF = -0.05
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) m[i].push(SELF)
            else {
                const phase = 2 * Math.PI * (j - i) / NUM_TYPES
                m[i].push(Math.sin(phase) * AMP)
            }
        }
    }
    return m
}

export function chiralBandpassGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, A1 = 0.7, A2 = 0.35, EPS = 0.15
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i].push(SELF); continue }
            const d = (j - i + NUM_TYPES) % NUM_TYPES
            const ph = 2 * Math.PI * d / NUM_TYPES
            const val = A1 * Math.sin(ph) + A2 * Math.sin(2 * ph) + EPS * (d > 0 ? 1 : -1)
            m[i].push(val)
        }
    }
    return m
}

export function rotatingConveyorGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, AMP = 0.8, TWIST = 2 * Math.PI / (NUM_TYPES * 1.5)
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i].push(SELF); continue }
            const ph = 2 * Math.PI * (j - i) / NUM_TYPES + TWIST * i
            m[i].push(AMP * Math.sin(ph))
        }
    }
    return m
}

export function primeHopGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, A = 0.9, R = -0.7
    const p = (n: number) => {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
        for (const x of primes) if (x < n) return x
        return 2
    }
    const P = p(NUM_TYPES)
    const circDist = (a: number, b: number) => Math.min((a - b + NUM_TYPES) % NUM_TYPES, (b - a + NUM_TYPES) % NUM_TYPES)
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i].push(SELF); continue }
            const d = (j - i + NUM_TYPES) % NUM_TYPES
            const val = (d % P === 0) ? A : R * Math.exp(-0.7 * circDist(i, j))
            m[i].push(val)
        }
    }
    return m
}

export function parityVortexGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, Aeo = 0.8, Aoe = 0.6, Ree = -0.4, Roo = -0.6
    const isEven = (x: number) => (x % 2) === 0
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i].push(SELF); continue }
            let val = 0
            if (isEven(i) && !isEven(j)) val = Aeo
            else if (!isEven(i) && isEven(j)) val = Aoe
            else val = isEven(i) ? Ree : Roo
            m[i].push(val)
        }
    }
    return m
}

export function helicalLadderGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, A = 0.7, B = 0.4, K = 2 * Math.PI / NUM_TYPES
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i].push(SELF); continue }
            const val = A * Math.sin(K * (j - i)) + B * Math.cos(K * (i + j))
            m[i].push(val)
        }
    }
    return m
}

export function biasedWaveGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, AMP = 0.75, BIAS = 0.15
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m.push([])
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i].push(SELF); continue }
            const ph = 2 * Math.PI * (j - i) / NUM_TYPES
            m[i].push(AMP * Math.sin(ph) + BIAS)
        }
    }
    return m
}

export function modularTriadsGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, IN = -0.2, NEXT = 0.85, PREV = -0.75
    const gid = (t: number) => t % 3
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i][j] = SELF; continue }
            const di = gid(i), dj = gid(j)
            const val = (di === dj) ? IN : ((dj === (di + 1) % 3) ? NEXT : PREV)
            m[i][j] = val
        }
    }
    return m
}

export function skippedPursuitGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, K = 2, A = 0.9, R = -0.6
    const circ = (d: number) => Math.min((d + NUM_TYPES) % NUM_TYPES, (-d + NUM_TYPES) % NUM_TYPES)
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i][j] = SELF; continue }
            const d = (j - i + NUM_TYPES) % NUM_TYPES
            const nearK = Math.min(circ(d - K), circ(d + K))
            const val = (d === K) ? A : (R * Math.exp(-0.8 * nearK))
            m[i][j] = val
        }
    }
    return m
}

function deterministicHash32(a: number, b: number): number {
    // simple 32-bit hash -> [0,1)
    let x = (a * 73856093) ^ (b * 19349663)
    x = (x ^ (x << 13)) ^ (x >>> 7) ^ (x << 17)
    return (x >>> 0) / 0xFFFFFFFF
}

export function blueNoiseConveyorGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, AMP = 0.9, SKEW = 0.8
    const m: Matrix = Array.from({ length: NUM_TYPES }, () => [])
    for (let i = 0; i < NUM_TYPES; i++) {
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i][j] = SELF; continue }
            const r = deterministicHash32(i, j) - 0.5
            m[i][j] = AMP * r * 2
        }
    }
    // antisymétrie biaisée pour drift
    for (let i = 0; i < NUM_TYPES; i++) {
        for (let j = i + 1; j < NUM_TYPES; j++) {
            m[j][i] = -SKEW * m[i][j]
        }
    }
    return m
}

export function offsetPhasefieldGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, AMP = 0.8, K = 2 * Math.PI / NUM_TYPES, TW = 3
    const theta = (i: number) => K * TW * i
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i][j] = SELF; continue }
            const val = AMP * Math.sin(theta(j) - theta(i)) + 0.12 * Math.sin(theta(i))
            m[i][j] = val
        }
    }
    return m
}

export function ringRoadGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, KA = 1, KR = Math.ceil(NUM_TYPES / 3), A = 0.85, R = -0.8
    const circ = (d: number) => Math.min((d + NUM_TYPES) % NUM_TYPES, (-d + NUM_TYPES) % NUM_TYPES)
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i][j] = SELF; continue }
            const d = circ(j - i)
            const val = (d <= KA) ? A : ((d <= KR) ? 0.2 : R)
            m[i][j] = val
        }
    }
    return m
}

export function triSpiralGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, A1 = 0.7, A3 = 0.55
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i][j] = SELF; continue }
            const ph = 2 * Math.PI * (j - i) / NUM_TYPES
            m[i][j] = A1 * Math.sin(ph) + A3 * Math.sin(3 * ph)
        }
    }
    return m
}

export function vortexAntivortexGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, AMP = 0.8
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i][j] = SELF; continue }
            const ph = 2 * Math.PI * (j - i) / NUM_TYPES
            const parity = ((i + j) % 2 === 0) ? 1 : -1
            m[i][j] = parity * AMP * Math.sin(ph)
        }
    }
    return m
}

export function driftedPatchworkGenerator(NUM_TYPES: number): Matrix {
    const SELF = -0.05, AMP = 0.75, BIAS = 0.12, DENS = 0.6
    const hash = (a: number, b: number) => {
        let x = (a * 2654435761) ^ (b * 1597334677)
        x = (x ^ (x << 13)) ^ (x >>> 7) ^ (x << 17)
        return (x >>> 0) / 0xFFFFFFFF
    }
    const m: Matrix = []
    for (let i = 0; i < NUM_TYPES; i++) {
        m[i] = []
        for (let j = 0; j < NUM_TYPES; j++) {
            if (i === j) { m[i][j] = SELF; continue }
            const ph = 2 * Math.PI * (j - i) / NUM_TYPES
            const base = AMP * Math.sin(ph) + BIAS
            const mask = (hash(i, j) < DENS) ? 1 : 0
            m[i][j] = base * mask
        }
    }
    return m
}

const RULES: { id: number; name: string; category?: string; generator: (n: number) => Matrix }[] = [
    { id: 0, name: 'Random', category: 'Default', generator: makeRandomRulesMatrix },
    { id: 1, name: 'Symmetric', category: 'Experimental', generator: symmetricGenerator },
    { id: 2, name: 'Snake', category: 'Experimental', generator: snakeGenerator },
    { id: 3, name: 'Chains 1', category: 'Experimental', generator: chains1Generator },
    { id: 4, name: 'Chains 2', category: 'Experimental', generator: chains2Generator },
    { id: 5, name: 'Chains 3', category: 'Experimental', generator: chains3Generator },
    { id: 6, name: 'Rock–Paper–Scissors', category: 'Experimental', generator: rockPaperScissorsGenerator },
    { id: 7, name: 'Bipartite Alliances', category: 'Experimental', generator: bipartiteGenerator },
    { id: 8, name: 'Hub and Spokes', category: 'Experimental', generator: hubAndSpokesGenerator },
    { id: 9, name: 'Concentric Shells', category: 'Experimental', generator: concentricShellsGenerator },
    { id: 10, name: 'Anti-symmetric Swirl', category: 'Experimental', generator: antiSymmetricSwirlGenerator },
    { id: 11, name: 'Checker Offsets', category: 'Experimental', generator: checkerOffsetsGenerator },
    { id: 12, name: 'Dimers & Chains', category: 'Experimental', generator: dimersAndChainsGenerator },
    { id: 13, name: 'Triad Flocks', category: 'Experimental', generator: triadFlocksGenerator },
    { id: 14, name: 'Spiral Conveyor', category: 'Experimental', generator: spiralConveyorGenerator },
    { id: 15, name: 'Patchwork', category: 'Experimental', generator: patchworkGenerator },
    { id: 16, name: 'Wavefield', category: 'Experimental', generator: wavefieldGenerator },
    { id: 17, name: 'Chiral Bandpass', category: 'Experimental', generator: chiralBandpassGenerator },
    { id: 18, name: 'Rotating Conveyor', category: 'Experimental', generator: rotatingConveyorGenerator },
    { id: 19, name: 'Prime Hop', category: 'Experimental', generator: primeHopGenerator },
    { id: 20, name: 'Parity Vortex', category: 'Experimental', generator: parityVortexGenerator },
    { id: 21, name: 'Helical Ladder', category: 'Experimental', generator: helicalLadderGenerator },
    { id: 22, name: 'Biased Wave', category: 'Experimental', generator: biasedWaveGenerator },
    { id: 23, name: 'Modular Triads', category: 'Experimental', generator: modularTriadsGenerator },
    { id: 24, name: 'Skipped Pursuit', category: 'Experimental', generator: skippedPursuitGenerator },
    { id: 25, name: 'Blue-Noise Conveyor', category: 'Experimental', generator: blueNoiseConveyorGenerator },
    { id: 26, name: 'Offset Phasefield', category: 'Experimental', generator: offsetPhasefieldGenerator },
    { id: 27, name: 'Ring Road', category: 'Experimental', generator: ringRoadGenerator },
    { id: 28, name: 'Tri-Spiral', category: 'Experimental', generator: triSpiralGenerator },
    { id: 29, name: 'Vortex–Antivortex Lattice', category: 'Experimental', generator: vortexAntivortexGenerator },
    { id: 30, name: 'Drifted Patchwork', category: 'Experimental', generator: driftedPatchworkGenerator },
]

export const RULES_OPTIONS: RuleOption[] = RULES.map(({ id, name, category }) => ({ id, name, category }))

export function generateRules(optionID: number, NUM_TYPES: number): Matrix {
    if (NUM_TYPES <= 0) return []

    const rule = RULES.find(rule => rule.id === optionID)
    const generator = rule?.generator ?? makeRandomRulesMatrix
    const finalMatrix = generator(NUM_TYPES)

    // Round to 2 decimal places without string conversion (toFixed)
    for (let i = 0; i < NUM_TYPES; i++) {
        for (let j = 0; j < NUM_TYPES; j++) {
            const value = finalMatrix[i] && typeof finalMatrix[i][j] === 'number' ? finalMatrix[i][j] : 0
            finalMatrix[i][j] = Math.round(value * 100) / 100
        }
    }

    return finalMatrix
}
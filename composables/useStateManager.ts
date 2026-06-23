import { hideAllPoppers } from "floating-vue"
const { success, error } = useToasts()

// ---------------------------------------------------------------------------------------------------------------------
// --- Simulation state (full particle snapshot) -----------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// Unlike presets (which only store rules/radii/colors/settings), a "state" captures the EXACT live snapshot of the
// simulation: the position, velocity and type of every single particle, alongside the metadata required to rebuild the
// GPU buffers identically (particle/species counts, world size, colors, matrices). This lets a user freeze a simulation
// and restore it later — in 2D or 3D — pixel-perfect.
//
// Because a snapshot can contain millions of floats, it is serialized to a compact binary container rather than JSON:
//   [ 4 bytes  ] magic     -> "SBXS"  (SandBox Science State)
//   [ 4 bytes  ] version   -> uint32 little-endian
//   [ 4 bytes  ] headerLen -> uint32 little-endian, byte length of the UTF-8 JSON header
//   [ headerLen] header    -> JSON metadata (everything except the raw particle floats)
//   [ ...rest  ] particles -> raw Float32 little-endian array (floatsPerParticle * numParticles values)
// ---------------------------------------------------------------------------------------------------------------------

export type SimStateEngine = "2D" | "3D"

export type SimState = {
    engine: SimStateEngine
    floatsPerParticle: number        // 5 for 2D (x,y,vx,vy,type), 7 for 3D (x,y,z,vx,vy,vz,type)
    numParticles: number
    numColors: number
    simWidth: number
    simHeight: number
    simDepth?: number                // 3D only
    colors: number[]                 // flat RGBA floats (0..1), length numColors * 4
    rulesMatrix: number[][]
    minRadiusMatrix: number[][]
    maxRadiusMatrix: number[][]
    particles: Float32Array          // raw particle data, length floatsPerParticle * numParticles
}

const MAGIC = "SBXS"
const VERSION = 1
const FILE_EXTENSION = "sbxstate"

const safeHidePoppers = () => {
    const active = document.activeElement as HTMLElement | null
    if (active && active.closest(".dropdownPresetOptions")) active.blur()
    hideAllPoppers()
}

// -----------------------------------------------------------------------------------------------------------------
// --- Serialize a SimState to a binary Blob -----------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------
const serializeState = (state: SimState): Blob => {
    const header = {
        engine: state.engine,
        floatsPerParticle: state.floatsPerParticle,
        numParticles: state.numParticles,
        numColors: state.numColors,
        simWidth: state.simWidth,
        simHeight: state.simHeight,
        simDepth: state.simDepth ?? null,
        colors: state.colors,
        rulesMatrix: state.rulesMatrix,
        minRadiusMatrix: state.minRadiusMatrix,
        maxRadiusMatrix: state.maxRadiusMatrix,
    }

    const headerBytes = new TextEncoder().encode(JSON.stringify(header))
    const magicBytes = new TextEncoder().encode(MAGIC)

    const prefix = new ArrayBuffer(12)
    const prefixView = new DataView(prefix)
    new Uint8Array(prefix).set(magicBytes, 0)               // 4 bytes magic
    prefixView.setUint32(4, VERSION, true)                  // 4 bytes version
    prefixView.setUint32(8, headerBytes.byteLength, true)   // 4 bytes header length

    // Copy the particle data into a fresh, tightly-packed buffer (the source view may be a sub-range of a larger one)
    const particleBytes = new Uint8Array(state.particles.buffer, state.particles.byteOffset, state.particles.byteLength)

    return new Blob([prefix, headerBytes, particleBytes], { type: "application/octet-stream" })
}

// -----------------------------------------------------------------------------------------------------------------
// --- Deserialize a binary ArrayBuffer back into a SimState -------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------
const deserializeState = (buffer: ArrayBuffer): SimState => {
    const view = new DataView(buffer)

    const magic = new TextDecoder().decode(new Uint8Array(buffer, 0, 4))
    if (magic !== MAGIC) throw new Error("Unrecognized file format (bad magic header).")

    const version = view.getUint32(4, true)
    if (version !== VERSION) throw new Error(`Unsupported state version (${version}).`)

    const headerLen = view.getUint32(8, true)
    const headerStart = 12
    const headerEnd = headerStart + headerLen
    if (headerEnd > buffer.byteLength) throw new Error("Corrupted file (header length out of bounds).")

    const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, headerStart, headerLen)))

    const expectedFloats = header.floatsPerParticle * header.numParticles
    const particleBytes = buffer.slice(headerEnd)
    const particles = new Float32Array(particleBytes)
    if (particles.length !== expectedFloats) {
        throw new Error(`Corrupted file (expected ${expectedFloats} particle floats, found ${particles.length}).`)
    }

    return {
        engine: header.engine,
        floatsPerParticle: header.floatsPerParticle,
        numParticles: header.numParticles,
        numColors: header.numColors,
        simWidth: header.simWidth,
        simHeight: header.simHeight,
        simDepth: header.simDepth ?? undefined,
        colors: header.colors,
        rulesMatrix: header.rulesMatrix,
        minRadiusMatrix: header.minRadiusMatrix,
        maxRadiusMatrix: header.maxRadiusMatrix,
        particles,
    }
}

// -----------------------------------------------------------------------------------------------------------------
// --- Trigger a browser download of the serialized state ----------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------
const downloadState = (state: SimState) => {
    try {
        const blob = serializeState(state)
        const url = URL.createObjectURL(blob)

        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
        const fileName = `particle-life-${state.engine.toLowerCase()}-${stamp}.${FILE_EXTENSION}`

        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        a.style.display = "none"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        success("Simulation state saved.")
    } catch (err) {
        console.error("Failed to save state:", err)
        error("Failed to save simulation state.")
    } finally {
        safeHidePoppers()
    }
}

// -----------------------------------------------------------------------------------------------------------------
// --- Read & parse a user-selected state file ---------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------
const readStateFile = async (file: File): Promise<SimState | null> => {
    try {
        const buffer = await file.arrayBuffer()
        return deserializeState(buffer)
    } catch (err) {
        console.error("Failed to read state file:", err)
        error(err instanceof Error ? err.message : "Failed to read state file.")
        return null
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// --- State manager composable ----------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
export const useStateManager = () => {
    return {
        FILE_EXTENSION,
        serializeState,
        deserializeState,
        downloadState,
        readStateFile,
    }
}

import { defineStore } from 'pinia'
import type {Preset} from "~/composables/usePresetManager";

export const useParticleLifeGPU3DStore = defineStore('particleLifeGPU3D', () => {
    const engineType = ref<'CPU' | 'GPU' | 'GPU3D'>('GPU3D') // Engine type
    const sidebarLeftOpen = ref<boolean>(false) // Is sidebar left open
    const isLockedPointer = ref<boolean>(false) // Prevent lifeCanvas events from being triggered
    const isHudLocked = ref<boolean>(false) // Disable HUD interactions during blocking actions (e.g. tracker selection)

    const isRunning = ref<boolean>(true) // Is the simulation running

    const currentColors = ref<Float32Array>() // Current colors for the particles
    const rulesMatrix = ref<number[][]>([]) // Rules matrix for each color
    const minRadiusMatrix = ref<number[][]>([]) // Min radius matrix for each color
    const maxRadiusMatrix = ref<number[][]>([]) // Max radius matrix for each color

    const simWidth = ref<number>(0) // Grid width
    const simHeight = ref<number>(0) // Grid height
    const simDepth = ref<number>(0) // Grid depth (for 3D)
    const linkProportions = ref<boolean>(false) // Constraint x y sim proportions

    const numParticles = ref<number>(128000) // Number of particles
    const particleSize = ref<number>(2.0) // Size of the particles at zoomFactor = 1
    const particleOpacity = ref<number>(1.0) // Opacity of the particles (0 to 1)
    const numColors = ref<number>(7) // Number of colors to be used

    const zoomSmoothing = ref<number>(0.15) // Smoothing factor for zooming (0 to 1, where 1 is no smoothing)
    const panSmoothing = ref<number>(0.17) // Smoothing factor for panning (0 to 1, where 1 is no smoothing)

    const isWallRepel = ref<boolean>(false) // Enable walls X and Y for the particles
    const isWallWrap = ref<boolean>(false) // Enable wrapped particles
    const wallState = computed({
        get: () => isWallRepel.value ? 'repel' : isWallWrap.value ? 'wrap' : 'none',
        set: (value: string) => {
            isWallRepel.value = value === 'repel'
            isWallWrap.value = value === 'wrap'
        }
    })

    const showLiveDeltaTime = ref<boolean>(false) // Show live Δt in the HUD (for debugging and performance monitoring)
    const manualDeltaTimeEnabled = ref<boolean>(false) // Override the automatic (framerate-independent) Δt with a fixed value
    const manualDeltaTime = ref<number>(0.0166) // Manual simulation time step in seconds (used only when manualDeltaTimeEnabled)

    // Define force properties
    const repel = ref<number>(1) // repel force for particles that are too close to each other
    const forceFactor = ref<number>(2) // Adjust the overall force applied between particles (can't be 0)
    const frictionFactor = ref<number>(0.3) // Slow down the particles (0 to 1, where 0 is no friction)

    // Define properties for randomizing radius matrix
    const minRadiusRange = ref<number[]>([28, 40]) // Range for the random minRadius of each color
    const maxRadiusRange = ref<number[]>([56, 80]) // Range for the random maxRadius of each color
    const currentMaxRadius = ref<number>(0) // Current max radius for the particles

    const useBinning = ref<boolean>(true) // Use spatial binning for neighbor search (vs brute force O(N²))
    const binningMode = ref<'grid' | 'hash'>('grid') // 'grid' = dense extended grid (default), 'hash' = Teschner spatial hash table
    const isBoundingBoxActive = ref<boolean>(true) // Show wireframe box for simulation boundaries
    const isGpuTimingsEnabled = ref<boolean>(false) // Enable per-pass GPU timestamp queries (binning/forces/advance/render). Off by default to save a tiny amount of GPU/CPU and avoid potential driver pipeline stalls.
    const isCameraTargetVisible = ref<boolean>(true) // Show a target at the center of the camera view (for debugging and visualizing camera movement in 3D space)

    const isParticleGlow = ref<boolean>(true) // Enable the HDR + dual-filter bloom pipeline (UI label: "Particle Glowing")
    const bloomThreshold = ref<number>(0.1) // Luminance above which pixels start to bloom (soft-knee)
    const bloomIntensity = ref<number>(0.12) // Bloom mix at compose time (final = hdr + bloom * intensity)
    const bloomKnee = ref<number>(1.0) // Soft-knee width: 0 = hard cutoff, 1 = very soft ramp
    const tonemapMode = ref<number>(1) // 1 = ACES Narkowicz

    const isParticleBorder = ref<boolean>(true) // Soft anti-aliased silhouette via coverage-as-color (free perf, kills 1px aliasing on big sprites)
    const isSphereShading = ref<boolean>(true) // Toggle sphere shading; off = original flat disc look
    const sphereAmbient = ref<number>(0.25) // Ambient term (added to diffuse contribution before mixing with base color)
    const sphereDiffuseStrength = ref<number>(0.85) // Diffuse Lambert strength
    const sphereSpecularStrength = ref<number>(0.45) // Specular Blinn-Phong strength (white highlight)
    const sphereShininess = ref<number>(24) // Specular exponent (higher = tighter highlight)
    const sphereLightDir = ref<number[]>([-0.4, 0.6, 0.8]) // Light direction in view space (normalized in shader) [-0.4, 0.6, 0.8], [-0.3, 0.7, 0.65], [0.43, 0.77, 0.5], [-0.2, 0.85, 0.5]

    const cellSubdivisions = ref<number>(1) // Number of subdivisions of maxRadius per cell (CELL_SIZE = maxRadius / cellSubdivisions)

    const gridExtensionFactor = ref<number>(12) // Requested extension factor for the dense grid
    const maxGridExtensionFactor = ref<number>(1) // Largest extension factor that fits the device cap for the current simSize / cellSize. Updated whenever binning is recomputed

    const selectedSpawnPositionOption = ref<number>(3) // Default to 'random' (0)
    const selectedRulesOption = ref<number>(0) // Default to 'random'
    const selectedColorPaletteOption = ref<number>(0) // Default to 'random'

    const savedPresets = ref<Record<string, Preset>>({}) // Saved presets from localStorage
    const isSaveModalOpen = ref<boolean>(false) // Is the save preset modal open

    function $reset() {
        sidebarLeftOpen.value = false
        currentMaxRadius.value = 0 // Prevent watcher from not triggering when page is reloaded (!important)
    }

    return {
        engineType, sidebarLeftOpen, isLockedPointer, isHudLocked,
        isRunning,
        rulesMatrix, minRadiusMatrix, maxRadiusMatrix, currentColors,
        simWidth, simHeight, simDepth, linkProportions,
        numParticles, particleSize, particleOpacity, numColors, zoomSmoothing, panSmoothing,
        isWallRepel, isWallWrap, wallState,
        minRadiusRange, maxRadiusRange, currentMaxRadius,
        repel, forceFactor, frictionFactor, useBinning, binningMode, isBoundingBoxActive, isGpuTimingsEnabled, isCameraTargetVisible,
        isParticleGlow, bloomThreshold, bloomIntensity, bloomKnee, tonemapMode,
        isParticleBorder, isSphereShading, sphereAmbient, sphereDiffuseStrength, sphereSpecularStrength, sphereShininess, sphereLightDir,
        selectedSpawnPositionOption, selectedRulesOption, selectedColorPaletteOption, savedPresets, isSaveModalOpen,
        cellSubdivisions, gridExtensionFactor, maxGridExtensionFactor,
        showLiveDeltaTime, manualDeltaTimeEnabled, manualDeltaTime,
        $reset
    }
})

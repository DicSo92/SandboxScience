import { defineStore } from 'pinia'

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

    const numParticles = ref<number>(96000) // Number of particles
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

    // Define force properties
    const repel = ref<number>(1) // repel force for particles that are too close to each other
    const forceFactor = ref<number>(2.5) // Adjust the overall force applied between particles (can't be 0)
    const frictionFactor = ref<number>(0.25) // Slow down the particles (0 to 1, where 0 is no friction)

    // Define properties for randomizing radius matrix
    const minRadiusRange = ref<number[]>([12, 24]) // Range for the random minRadius of each color
    const maxRadiusRange = ref<number[]>([32, 64]) // Range for the random maxRadius of each color
    const currentMaxRadius = ref<number>(0) // Current max radius for the particles

    const useSpatialHash = ref<boolean>(true) // Use spatial hash for collision detection or brute force
    const isBoundingBoxActive = ref<boolean>(true) // Show wireframe box for simulation boundaries

    const cellSubdivisions = ref<number>(2) // Number of subdivisions of maxRadius per cell (CELL_SIZE = maxRadius / cellSubdivisions)

    const selectedRulesOption = ref<number>(0) // Default to 'random'
    const selectedColorPaletteOption = ref<number>(0) // Default to 'random'

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
        repel, forceFactor, frictionFactor, useSpatialHash, isBoundingBoxActive,
        selectedRulesOption, selectedColorPaletteOption,
        cellSubdivisions,
        $reset
    }
})

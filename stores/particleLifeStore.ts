import { defineStore } from 'pinia'
export const useParticleLifeStore = defineStore('particleLife', () => {
    const sidebarLeftOpen = ref<boolean>(false) // Is sidebar left open
    const isLockedPointer = ref<boolean>(false) // Prevent lifeCanvas events from being triggered

    const isRunning = ref<boolean>(true) // Is the simulation running
    const isBrushActive = ref<boolean>(false) // Is the brush active
    const brushes = ref<number[]>([]) // Brush particles
    const brushRadius = ref<number>(300) // Brush radius
    const brushIntensity = ref<number>(10) // Brush intensity (number of particles)
    const brushType = ref<number>(1) // Brush type (0: Add, 1: Remove)
    const attractForce = ref<number>(10) // Attract force for the brush
    const repulseForce = ref<number>(10) // Repulse force for the brush
    const wallRepelForce = ref<number>(1.8) // Repulse force for the walls (velocity will be multiplied by this value negative)

    const currentColors = ref<number[]>([]) // Current colors for the particles
    const rulesMatrix = ref<number[][]>([]) // Rules matrix for each color
    const minRadiusMatrix = ref<number[][]>([]) // Min radius matrix for each color
    const maxRadiusMatrix = ref<number[][]>([]) // Max radius matrix for each color

    const gridWidth = ref<number>(0) // Grid width
    const gridHeight = ref<number>(0) // Grid height
    const linkProportions = ref<boolean>(false) // Constraint x y grid proportions

    const numParticles = ref<number>(6000) // Number of particles
    const particleSize = ref<number>(6) // Size of the particles at zoomFactor = 1
    const numColors = ref<number>(7) // Number of colors to be used
    const depthLimit = ref<number>(420) // Maximum Z axis depth (0 means almost 2D because there is friction with the walls && can be negative)

    const is3D = ref<boolean>(true) // Enable 3D Algorithm
    const isCircle = ref<boolean>(true) // Enable circular shape for the particles
    const hasGrid = ref<boolean>(true) // Enable grid
    const hasCells = ref<boolean>(false) // Enable cells
    const isCellFollow = ref<boolean>(false) // Enable cells to follow the particles
    const isWallRepel = ref<boolean>(true) // Enable walls X and Y for the particles
    const isWallWrap = ref<boolean>(false) // Enable wrapped particles
    const hasDepthSize = ref<boolean>(true) // Enable depth size effect
    const hasDepthOpacity = ref<boolean>(false) // Enable depth opacity effect
    const maxOpacity = ref<number>(1) // Maximum opacity when hasDepthOpacity is enabled
    const minOpacity = ref<number>(0.5) // Depth effect will be stronger with lower opacity
    const cellShape = ref<number>(0) // 0: Rectangle, 1: Circle
    const wallShape = ref<number>(0) // 0: Rectangle, 1: Circle
    const screenMultiplierForGridSize = ref<number>(3) // Multiplier for the grid size (1 means the grid will be the same size as the screen)

    const cellGroupSize = ref<number>(0) // Minimum number of particles to be considered a group (0 to visualize all cells)
    const cellSizeFactor = ref<number>(1) // Size of the cells at zoomFactor = 1

    // Define force properties
    const repel = ref<number>(1) // repel force for particles that are too close to each other
    const forceFactor = ref<number>(0.4) // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move)
    const frictionFactor = ref<number>(0.6) // Slow down the particles (0 to 1, where 1 is no friction)

    // Define properties for randomizing radius matrix
    const minRadiusRange = ref<number[]>([30, 60]) // Range for the random minRadius of each color
    const maxRadiusRange = ref<number[]>([90, 150]) // Range for the random maxRadius of each color

    const currentMaxRadius = ref<number>(0) // Current max radius for the particles

    const captureType = ref<string>('') // Capture type (screenshot or GIF)
    const isCapturingGIF = ref<boolean>(false) // Start capturing GIF frames
    const isControlsCanvasOpen = ref<boolean>(false) // Is controls canvas open

    function $reset() {
        sidebarLeftOpen.value = false
        currentMaxRadius.value = 0 // Prevent watcher from not triggering when page is reloaded (!important)
    }

    return {
        sidebarLeftOpen, isLockedPointer,
        isRunning, isBrushActive, brushes, brushRadius, brushIntensity, brushType, attractForce, repulseForce, wallRepelForce,
        rulesMatrix, minRadiusMatrix, maxRadiusMatrix, currentColors,
        gridWidth, gridHeight, linkProportions,
        numParticles, particleSize, numColors, depthLimit,
        is3D, isCircle, hasGrid, hasCells, isCellFollow, isWallRepel, isWallWrap, hasDepthSize, hasDepthOpacity, maxOpacity, minOpacity, cellShape, wallShape, screenMultiplierForGridSize,
        minRadiusRange, maxRadiusRange, currentMaxRadius,
        repel, forceFactor, frictionFactor,
        cellGroupSize, cellSizeFactor,
        captureType, isCapturingGIF, isControlsCanvasOpen,
        $reset
    }
})

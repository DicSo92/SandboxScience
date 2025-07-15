import { defineStore } from 'pinia'
export const useParticleLifeGPUStore = defineStore('particleLifeGPU', () => {
    const sidebarLeftOpen = ref<boolean>(false) // Is sidebar left open
    const isLockedPointer = ref<boolean>(false) // Prevent lifeCanvas events from being triggered

    const isRunning = ref<boolean>(true) // Is the simulation running

    const currentColors = ref<Float32Array>() // Current colors for the particles
    const rulesMatrix = ref<number[][]>([]) // Rules matrix for each color
    const minRadiusMatrix = ref<number[][]>([]) // Min radius matrix for each color
    const maxRadiusMatrix = ref<number[][]>([]) // Max radius matrix for each color

    const gridWidth = ref<number>(0) // Grid width
    const gridHeight = ref<number>(0) // Grid height

    const numParticles = ref<number>(48000) // Number of particles
    const particleSize = ref<number>(1.3) // Size of the particles at zoomFactor = 1
    const numColors = ref<number>(7) // Number of colors to be used

    const is3D = ref<boolean>(true) // Enable 3D Algorithm
    const isWallRepel = ref<boolean>(false) // Enable walls X and Y for the particles
    const isWallWrap = ref<boolean>(true) // Enable wrapped particles
    const screenMultiplierForGridSize = ref<number>(3) // Multiplier for the grid size (1 means the grid will be the same size as the screen)

    // Define force properties
    const repel = ref<number>(1) // repel force for particles that are too close to each other
    const forceFactor = ref<number>(0.6) // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move)
    const frictionFactor = ref<number>(0.6) // Slow down the particles (0 to 1, where 1 is no friction)

    // Define properties for randomizing radius matrix
    const minRadiusRange = ref<number[]>([25, 40]) // Range for the random minRadius of each color
    const maxRadiusRange = ref<number[]>([60, 80]) // Range for the random maxRadius of each color

    const currentMaxRadius = ref<number>(0) // Current max radius for the particles

    const useSpatialHash = ref<boolean>(true) // Use spatial hash for collision detection or brute force

    const isBrushActive = ref<boolean>(false) // Is the brush active
    const brushes = ref<number[]>([]) // Brush particles
    const brushRadius = ref<number>(300) // Brush radius
    const brushIntensity = ref<number>(10) // Brush intensity (number of particles)
    const brushType = ref<number>(1) // Brush type (0: Add, 1: Remove)
    const attractForce = ref<number>(10) // Attract force for the brush
    const repulseForce = ref<number>(10) // Repulse force for the brush

    function $reset() {
        sidebarLeftOpen.value = false
        currentMaxRadius.value = 0 // Prevent watcher from not triggering when page is reloaded (!important)
    }

    return {
        sidebarLeftOpen, isLockedPointer,
        isRunning,
        rulesMatrix, minRadiusMatrix, maxRadiusMatrix, currentColors,
        gridWidth, gridHeight,
        numParticles, particleSize, numColors,
        is3D, isWallRepel, isWallWrap, screenMultiplierForGridSize,
        minRadiusRange, maxRadiusRange, currentMaxRadius,
        repel, forceFactor, frictionFactor, useSpatialHash,
        isBrushActive, brushes, brushRadius, brushIntensity, brushType, attractForce, repulseForce,
        $reset
    }
})

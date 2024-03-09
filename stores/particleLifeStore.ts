import { defineStore } from 'pinia'
export const useParticleLifeStore = defineStore('particleLife', () => {
    const sidebarLeftOpen = ref<boolean>(false)

    const numParticles = ref<number>(6000) // Number of particles
    const particleSize = ref<number>(4) // Size of the particles at zoomFactor = 1
    const numColors = ref<number>(8) // Number of colors to be used
    const depthLimit = ref<number>(240) // Maximum Z axis depth (0 means almost 2D because there is friction with the walls && can be negative)

    const isCircle = ref<boolean>(true) // Enable circular shape for the particles
    const hasGrid = ref<boolean>(true) // Enable grid
    const hasCells = ref<boolean>(false) // Enable cells
    const hasWalls = ref<boolean>(true) // Enable walls X and Y for the particles
    const hasDepthSize = ref<boolean>(true) // Enable depth size effect
    const hasDepthOpacity = ref<boolean>(true) // Enable depth opacity effect
    const maxOpacity = ref<number>(1) // Maximum opacity when hasDepthOpacity is enabled
    const minOpacity = ref<number>(0.5) // Depth effect will be stronger with lower opacity

    const cellGroupSize = ref<number>(0) // Minimum number of particles to be considered a group (0 to visualize all cells)

    // Define force properties
    const maxRadius = ref<number>(60) // maximum distance for particles to start attracting
    const minRadius = ref<number>(20) // minimum distance for particles to start repelling
    const repel = ref<number>(1) // repel force for particles that are too close to each other
    const forceFactor = ref<number>(0.4) // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move)
    const frictionFactor = ref<number>(0.6) // Slow down the particles (0 to 1, where 1 is no friction)

    function $reset() {
        sidebarLeftOpen.value = false
    }

    return {
        sidebarLeftOpen,
        numParticles, particleSize, numColors, depthLimit,
        isCircle, hasGrid, hasCells, hasWalls, hasDepthSize, hasDepthOpacity, maxOpacity, minOpacity,
        maxRadius, minRadius, repel, forceFactor, frictionFactor,
        cellGroupSize,
        $reset
    }
})
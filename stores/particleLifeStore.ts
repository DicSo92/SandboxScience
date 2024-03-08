import { defineStore } from 'pinia'
export const useParticleLifeStore = defineStore('particleLife', () => {
    const sidebarLeftOpen = ref<boolean>(false)
    const isCircle = ref<boolean>(true) // Enable circular shape for the particles
    const hasGrid = ref<boolean>(true) // Enable grid
    const hasCells = ref<boolean>(false) // Enable cells
    const hasWalls = ref<boolean>(true) // Enable walls X and Y for the particles
    const hasDepthSize = ref<boolean>(true) // Enable depth size effect
    const hasDepthOpacity = ref<boolean>(true) // Enable depth opacity effect

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
        isCircle, hasGrid, hasCells, hasWalls, hasDepthSize, hasDepthOpacity,
        maxRadius, minRadius, repel, forceFactor, frictionFactor,
        $reset
    }
})
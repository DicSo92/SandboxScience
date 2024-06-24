import { defineStore } from 'pinia'
export const useQuadStore = defineStore('game', () => {
    const isRunning = ref<boolean>(false) // is the animation running?
    const wasRunning = ref<boolean>(false) // was the animation running? (used to pause the animation)

    const SPEED = ref<number>(1) // the speed of the animation (ms)
    const EDGEMODE = ref<number>(2) // dead, alive, mirror
    const BORN = shallowRef<number[]>([3]) // the number of neighbours for a dead cell to born
    const SURVIVES =  shallowRef<number[]>([2, 3]) // the number of neighbours for a living cell to survive

    const population = ref<number>(0) // the population (number of living cells)
    const generation = ref<number>(0) // the generation (number of iterations)

    const sidebarLeftOpen = ref<boolean>(false)
    const sidebarRightOpen = ref<boolean>(false)

    function $reset() {
        sidebarLeftOpen.value = false
        sidebarRightOpen.value = false
    }

    return {
        isRunning, wasRunning,
        SPEED, EDGEMODE, BORN, SURVIVES,
        population, generation, sidebarLeftOpen, sidebarRightOpen,
        $reset,
    }
})
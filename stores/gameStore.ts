import { defineStore } from 'pinia'
export const useGameStore = defineStore('game', () => {
    const size = ref<number>(16) // the size of every cell
    const rows = ref<number>(256) // number of rows
    const cols = ref<number>(256) // number of columns

    const isRunning = ref<boolean>(false) // is the animation running?
    const wasRunning = ref<boolean>(false) // was the animation running? (used to pause the animation)
    const hoveredSide = ref<number | null>(null)

    const SPEED = ref<number>(1) // the speed of the animation (ms)
    const EDGEMODE = ref<number>(2) // dead, alive, mirror
    const BORN = shallowRef<number[]>([3]) // the number of neighbours for a dead cell to born
    const SURVIVES =  shallowRef<number[]>([2, 3]) // the number of neighbours for a living cell to survive

    const sliderMin = ref<number>(1000)
    const sliderMax = ref<number>(8000)

    const maxNeighbours = computed(() => Math.max.apply(Math, BORN.value.concat(SURVIVES.value))) // the maximum number of neighbours

    return {
        size, rows, cols,
        isRunning, wasRunning, hoveredSide,
        SPEED, EDGEMODE, BORN, SURVIVES,
        sliderMin, sliderMax, maxNeighbours
    }
})
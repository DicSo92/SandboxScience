import { defineStore } from 'pinia'
import type {UnwrapRefSimple} from "@vue/reactivity";

export const useGameStore = defineStore('game', () => {
    const canvasWidth = ref<number>(0) // the width of the canvas
    const canvasHeight = ref<number>(0) // the height of the canvas

    const size = ref<number>(20) // the size of every cell
    const rows = ref<number>(38) // number of rows
    const cols = ref<number>(100) // number of columns
    const rowx = ref<number>(0) // starting row
    const colx = ref<number>(0) // starting column

    const cellsArray = Array(rows.value).map(() => new Int32Array(cols.value).fill(0))
    const cellsArrayNext = Array(rows.value).map(() => new Int32Array(cols.value).fill(0))
    const isRunning = ref<boolean>(false) // is the animation running?
    const wasRunning = ref<boolean | null>(null) // was the animation running? (used to pause the animation)

    const SPEED = ref<number>(1) // the speed of the animation (ms)
    const EDGEMODE = ref<string>('mirror') // dead, alive, mirror
    const BORN = ref<number[]>([3]) // the number of neighbours for a dead cell to born
    const SURVIVES =  ref<number[]>([2, 3]) // the number of neighbours for a living cell to survive

    const sliderMin = ref<number>(1000)
    const sliderMax = ref<number>(8000)

    return {
        canvasWidth, canvasHeight,
        size, rows, cols, rowx, colx,
        cellsArray, cellsArrayNext, isRunning, wasRunning,
        SPEED, EDGEMODE, BORN, SURVIVES,
        sliderMin, sliderMax
    }
})
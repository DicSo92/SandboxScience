import { defineStore } from 'pinia'
import { Cell } from "~/models/classes/Cell"

export const useGameStore = defineStore('game', () => {
    const canvasWidth = ref<number>(0) // the width of the canvas
    const canvasHeight = ref<number>(0) // the height of the canvas
    const size = ref<number>(20) // the size of every cell
    const rows = ref<number>(20) // number of rows
    const cols = ref<number>(40) // number of columns
    const rowx = ref<number>(0) // starting row
    const colx = ref<number>(0) // starting column

    const SPEED = ref<number>(50) // the speed of the animation (ms)
    const cellsArray = reactive([] as Cell[]) // array of cells
    const edgeMode = ref<string>('mirror') // dead, alive, mirror
    const isRunning = ref<boolean>(false) // is the animation running?

    const sliderMin = ref<number>(1000)
    const sliderMax = ref<number>(8000)

    return { SPEED, canvasWidth, canvasHeight, size, rows, cols, cellsArray, edgeMode, isRunning, sliderMin, sliderMax, rowx, colx }
})
import { defineStore } from 'pinia'
import { Cell } from "~/models/classes/Cell"

export const useGameStore = defineStore('game', () => {
    const canvasWidth = ref<number>(1200) // the width of the canvas
    const canvasHeight = ref<number>(800) // the height of the canvas
    const size = ref<number>(20) // the size of every cell
    const rows = ref<number>(canvasHeight.value / size.value) // number of rows
    const cols = ref<number>(canvasWidth.value / size.value) // number of columns

    const SPEED = ref<number>(50) // the speed of the animation (ms)
    const cellsArray = reactive([] as Cell[]) // array of cells
    const edgeMode = ref<string>('mirror') // dead, alive, mirror

    return { SPEED, canvasWidth, canvasHeight, size, rows, cols, cellsArray, edgeMode }
})
import { defineStore } from 'pinia'
export const useGameStore = defineStore('game', () => {
    const SPEED = ref<number>(50) // the speed of the animation (ms)

    const canvasWidth = ref<number>(1200) // the width of the canvas
    const canvasHeight = ref<number>(800) // the height of the canvas
    const size = ref<number>(20) // the size of every cell
    const rows = ref<number>(canvasHeight.value / size.value) // number of rows
    const cols = ref<number>(canvasWidth.value / size.value) // number of columns

    // const doubleCount = computed(() => count.value * 2)
    function increment() {
        //
    }

    return { SPEED, canvasWidth, canvasHeight, size, rows, cols }
})
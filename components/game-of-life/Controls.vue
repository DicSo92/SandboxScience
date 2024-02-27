<template>
    <div w-full flex items-start justify-center>
        <div btn p1 mx-1 flex items-center bg="gray-700 hover:gray-800" @click="$emit('getExecutionAverage')">
            <div i-game-icons-perspective-dice-six-faces-random text-2xl></div>
        </div>
        <div btn p1 mx-1 flex items-center bg="orange-700 hover:orange-800" @click="$emit('randomCells', ((game.rows * game.cols) * 20) / 100)">
            <div i-fad-arprandom text-2xl></div>
        </div>
        <div btn p1 mx-1 flex items-center bg="red-700 hover:red-900" @click="$emit('killRandom', ((game.rows * game.cols) * 20) / 100)">
            <div i-tabler-skull text-2xl></div>
        </div>
        <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.newCycle()">
            <div i-tabler-player-track-prev-filled text-xl></div>
        </div>
        <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.newCycle()">
            <div i-tabler-player-track-next-filled text-xl></div>
        </div>
        <div btn p2 flex items-center mx-1 bg="green-700 hover:green-900" @click="$emit('toggleIsRunning')">
            <div text-xl :class="game.isRunning ? 'i-tabler-player-pause-filled' : 'i-tabler-player-play-filled'"></div>
        </div>
        <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.handleZoom(1)">
            <div i-tabler-zoom-in text-xl></div>
        </div>
        <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.handleZoom(-1)">
            <div i-tabler-zoom-out text-xl></div>
        </div>
        <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.expandGrid('left', 1)">
            <div i-tabler-arrow-bar-left text-xl></div>
        </div>
        <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.expandGrid('right', 1)">
            <div i-tabler-arrow-bar-right text-xl></div>
        </div>
        <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.expandGrid('top', 1)">
            <div i-tabler-arrow-bar-to-up text-xl></div>
        </div>
        <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.expandGrid('bottom', 1)">
            <div i-tabler-arrow-bar-to-down text-xl></div>
        </div>
    </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({
    props: ['naiveCanvas'],
    setup(props, { emit }) {
        const game = useGameStore()

        return { game }
    }
})
</script>

<style scoped>

</style>
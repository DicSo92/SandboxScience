<template>
    <div fixed z-10 bottom-2 flex justify-center items-end pointer-events-none class="left-1/2 transform -translate-x-1/2">
        <button type="button" name="Toggle Fullscreen" aria-label="Toggle Fullscreen" title="Toggle Fullscreen"
                btn p2 rounded-full mx-1 flex items-center pointer-events-auto backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
                @click="$emit('toggleFullscreen')">
            <span :class="isFullscreen ? 'i-tabler-maximize-off' : 'i-tabler-maximize'"></span>
        </button>
        <button type="button" name="Zoom Out" aria-label="Zoom Out" title="Zoom Out"
                btn p2 rounded-full mx-1 flex items-center pointer-events-auto backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
                @click="naiveCanvas.handleZoom(-1)">
            <span i-tabler-zoom-out></span>
        </button>
        <button type="button" name="Play/Pause" aria-label="Play/Pause" title="Play or Pause"
                btn p3 rounded-full mx-1 flex items-center pointer-events-auto backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
                @click="$emit('toggleIsRunning')">
            <span text-xl :class="game.isRunning ? 'i-tabler-player-pause-filled' : 'i-tabler-player-play-filled'"></span>
        </button>
        <button type="button" name="Step" aria-label="Step" title="Step forward one generation"
                btn p2 rounded-full mx-1 flex items-center pointer-events-auto backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
                :disabled="game.isRunning"
                @click="naiveCanvas.newCycle()">
            <span i-tabler-player-skip-forward-filled></span>
        </button>
        <button type="button" name="Zoom In" aria-label="Zoom In" title="Zoom In"
                btn p2 rounded-full mx-1 flex items-center pointer-events-auto backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
                @click="naiveCanvas.handleZoom(1)">
            <span i-tabler-zoom-in></span>
        </button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    props: ['naiveCanvas', 'isFullscreen'],
    emits: ['toggleIsRunning', 'toggleFullscreen'],
    setup() {
        const game = useGameStore()
        return { game }
    }
})
</script>
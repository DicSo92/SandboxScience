<template>
    <div pointer-events-none fixed bottom-2 z-10 flex items-end justify-center class="left-1/2 transform -translate-x-1/2">
        <button
            type="button" name="Toggle Fullscreen" aria-label="Toggle Fullscreen" title="Toggle Fullscreen"
            btn pointer-events-auto mx-1 flex items-center rounded-full p2 backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
            @click="$emit('toggleFullscreen')"
        >
            <span :class="isFullscreen ? 'i-tabler-maximize-off' : 'i-tabler-maximize'" />
        </button>
        <button
            type="button" name="Zoom Out" aria-label="Zoom Out" title="Zoom Out"
            btn pointer-events-auto mx-1 flex items-center rounded-full p2 backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
            @click="naiveCanvas.handleZoom(-1)"
        >
            <span i-tabler-zoom-out />
        </button>
        <button
            type="button" name="Play/Pause" aria-label="Play/Pause" title="Play or Pause"
            btn pointer-events-auto mx-1 flex items-center rounded-full p3 backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
            @click="$emit('toggleIsRunning')"
        >
            <span text-xl :class="game.isRunning ? 'i-tabler-player-pause-filled' : 'i-tabler-player-play-filled'" />
        </button>
        <button
            type="button" name="Step" aria-label="Step" title="Step forward one generation"
            btn pointer-events-auto mx-1 flex items-center rounded-full p2 backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
            :disabled="game.isRunning"
            @click="naiveCanvas.newCycle()"
        >
            <span i-tabler-player-skip-forward-filled />
        </button>
        <button
            type="button" name="Zoom In" aria-label="Zoom In" title="Zoom In"
            btn pointer-events-auto mx-1 flex items-center rounded-full p2 backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
            @click="naiveCanvas.handleZoom(1)"
        >
            <span i-tabler-zoom-in />
        </button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
    props: ['naiveCanvas', 'isFullscreen'],
    emits: ['toggleIsRunning', 'toggleFullscreen'],
    setup() {
        const game = useGameStore()
        return { game }
    },
})
</script>

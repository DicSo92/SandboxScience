<template>
    <div class="group pointer-events-auto relative">
        <!-- Main tracker button -->
        <button
            type="button" name="Particle Tracker" aria-label="Particle Tracker" title="Track a creature"
            btn flex items-center justify-center rounded-full p-2
            class="relative z-10 backdrop-blur-sm"
            :class="particleLife.isTrackerSelectionActive
                ? 'bg-amber-700/90 hover:bg-amber-600/90 animate-pulse'
                : particleLife.isTrackerActive
                    ? 'bg-rose-600/90 hover:bg-rose-500/90'
                    : 'bg-rose-900/80 hover:bg-rose-800/80'"
            @click="$emit('toggle')"
        >
            <span :class="particleLife.isTrackerSelectionActive ? 'i-tabler-marquee-2 text-white' : particleLife.isTrackerActive ? 'i-tabler-current-location text-white' : 'i-tabler-current-location text-rose-300'" />
            <span v-if="particleLife.isTrackerActive && !particleLife.isTrackerSelectionActive" class="absolute size-3 flex -right-0.5 -top-0.5">
                <span class="absolute h-full w-full inline-flex animate-ping rounded-full bg-rose-400 opacity-75 ring-1 ring-rose-300/50" />
                <span class="relative size-3 inline-flex rounded-full bg-rose-400" />
            </span>
        </button>
        <div
            v-if="particleLife.isTrackerActive" class="absolute left-1/2 top-1/2 h-8 flex items-center rounded-r-full bg-slate-800/95 ring-1 ring-slate-600/50 backdrop-blur-sm transition-all duration-200 delay-500 ease-out -translate-y-1/2 group-hover:delay-0"
            :class="showInitial
                ? 'w-21 pl-5 pr-1 opacity-100'
                : 'w-0 opacity-0 group-hover:w-21 group-hover:pl-5 group-hover:pr-1 group-hover:opacity-100'"
        >
            <!-- Camera Follow toggle -->
            <button
                type="button" title="Camera Follow" aria-label="Camera Follow"
                class="ml-1.5 flex shrink-0 items-center justify-center rounded-full p-1 transition-all"
                :class="particleLife.isTrackerCameraActive
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'bg-slate-600/80 hover:bg-slate-600/80 text-slate-400'"
                @click="particleLife.isTrackerCameraActive = !particleLife.isTrackerCameraActive"
            >
                <span i-tabler-route text-sm />
            </button>
            <!-- Indicator toggle -->
            <button
                type="button" title="Show Indicator" aria-label="Show Indicator"
                class="ml-1 flex shrink-0 items-center justify-center rounded-full p-1 transition-all"
                :class="particleLife.isTrackerIndicatorVisible
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-slate-600/80 hover:bg-slate-500/80 text-slate-400'"
                @click="particleLife.isTrackerIndicatorVisible = !particleLife.isTrackerIndicatorVisible"
            >
                <span i-tabler-viewfinder text-sm />
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
    name: 'TrackerToggle',
    emits: ['toggle'],
    setup() {
        const particleLife = useParticleLifeGPUStore()
        const showInitial = ref<boolean>(false)
        const { start, stop } = useTimeoutFn(() => {
            showInitial.value = false
        }, 3000, { immediate: false })

        watch(() => particleLife.isTrackerActive, (newVal) => {
            if (newVal) {
                showInitial.value = true
                start()
            }
            else {
                showInitial.value = false
                stop()
            }
        })

        return { particleLife, showInitial }
    },
})
</script>

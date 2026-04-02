<template>
    <div class="group pointer-events-auto relative">
        <!-- Main tracker button -->
        <button type="button" name="Particle Tracker" aria-label="Particle Tracker" title="Track a creature"
                btn rounded-full flex items-center justify-center p-2
                class="backdrop-blur-sm z-10 relative"
                :class="particleLife.isTrackerSelectionActive
                    ? 'bg-amber-700/90 hover:bg-amber-600/90 animate-pulse'
                    : particleLife.isTrackerActive
                        ? 'bg-rose-600/90 hover:bg-rose-500/90'
                        : 'bg-rose-900/80 hover:bg-rose-800/80'"
                @click="$emit('toggle')">
            <span :class="particleLife.isTrackerSelectionActive ? 'i-tabler-marquee-2 text-white' : particleLife.isTrackerActive ? 'i-tabler-current-location text-white' : 'i-tabler-current-location text-rose-300'"></span>
            <span v-if="particleLife.isTrackerActive && !particleLife.isTrackerSelectionActive" class="absolute -top-0.5 -right-0.5 flex size-3">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 ring-1 ring-rose-300/50 opacity-75"></span>
                <span class="relative inline-flex size-3 rounded-full bg-rose-400"></span>
            </span>
        </button>
        <div v-if="particleLife.isTrackerActive" class="absolute left-1/2 top-1/2 -translate-y-1/2 flex items-center h-8 rounded-r-full bg-slate-800/95 backdrop-blur-sm ring-1 ring-slate-600/50 transition-all duration-200 ease-out delay-500 group-hover:delay-0"
             :class="showInitial
                 ? 'w-21 pl-5 pr-1 opacity-100'
                 : 'w-0 opacity-0 group-hover:w-21 group-hover:pl-5 group-hover:pr-1 group-hover:opacity-100'">
            <!-- Camera Follow toggle -->
            <button type="button" title="Camera Follow" aria-label="Camera Follow"
                    class="flex items-center justify-center p-1 rounded-full ml-1.5 transition-all shrink-0"
                    :class="particleLife.isTrackerCameraActive 
                        ? 'bg-violet-600 hover:bg-violet-500 text-white'
                        : 'bg-slate-600/80 hover:bg-slate-600/80 text-slate-400'"
                    @click="particleLife.isTrackerCameraActive = !particleLife.isTrackerCameraActive">
                <span i-tabler-route text-sm></span>
            </button>
            <!-- Indicator toggle -->
            <button type="button" title="Show Indicator" aria-label="Show Indicator"
                    class="flex items-center justify-center p-1 rounded-full ml-1 transition-all shrink-0"
                    :class="particleLife.isTrackerIndicatorVisible 
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-slate-600/80 hover:bg-slate-500/80 text-slate-400'"
                    @click="particleLife.isTrackerIndicatorVisible = !particleLife.isTrackerIndicatorVisible">
                <span i-tabler-viewfinder text-sm></span>
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { useTimeoutFn } from '@vueuse/core'

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
            } else {
                showInitial.value = false
                stop()
            }
        })

        return { particleLife, showInitial }
    }
})
</script>
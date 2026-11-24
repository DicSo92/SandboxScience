<template>
    <div class="group pointer-events-auto relative">
        <!-- Main center view button -->
        <button
            type="button" name="Center View" aria-label="Center View" title="Center View"
            btn flex items-center justify-center rounded-full p-2
            class="relative z-10 bg-cyan-900/80 backdrop-blur-sm hover:bg-cyan-800/80"
            :disabled="disabled" @click="$emit('centerAll')"
        >
            <span i-tabler-object-scan class="text-cyan-300" />
        </button>
        <div v-show="!disabled" class="absolute left-1/2 top-1/2 h-8 w-0 flex items-center rounded-r-full bg-slate-800/95 p-1 opacity-0 ring-1 ring-slate-600/50 backdrop-blur-sm transition-all duration-200 delay-500 ease-out -translate-y-1/2 group-hover:pl-5 group-hover:pr-1 group-hover:opacity-100 group-hover:delay-0" :class="is3D ? 'group-hover:w-28' : 'group-hover:w-21'">
            <!-- Center position -->
            <button
                type="button" title="Center Position" aria-label="Center Position"
                class="ml-1.5 aspect-square h-full flex shrink-0 items-center justify-center rounded-full bg-cyan-600 p-1 text-white transition-all hover:bg-cyan-500"
                @click="$emit('centerPosition')"
            >
                <span i-tabler-location text-sm class="-mb-0.5" />
            </button>
            <!-- Reset zoom -->
            <button
                type="button" title="Reset Zoom" aria-label="Reset Zoom"
                class="ml-1 flex shrink-0 items-center justify-center rounded-full bg-violet-600 p-1 text-white transition-all hover:bg-violet-500"
                @click="$emit('resetZoom')"
            >
                <span i-tabler-zoom text-sm />
            </button>
            <!-- Reset rotation (3D only) -->
            <button
                v-if="is3D" type="button" title="Reset Rotation" aria-label="Reset Rotation"
                class="ml-1 flex shrink-0 items-center justify-center rounded-full bg-amber-600 p-1 text-white transition-all hover:bg-amber-500"
                @click="$emit('resetRotation')"
            >
                <span i-tabler-rotate-3d text-sm />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ disabled?: boolean, is3D?: boolean }>()
defineEmits<{
    centerAll: []
    centerPosition: []
    resetZoom: []
    resetRotation: []
}>()
</script>

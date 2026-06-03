<template>
    <div class="group pointer-events-auto relative">
        <!-- Main center view button -->
        <button type="button" name="Center View" aria-label="Center View" title="Center View"
                btn rounded-full flex items-center justify-center p-2
                class="backdrop-blur-sm bg-cyan-900/80 hover:bg-cyan-800/80 z-10 relative"
                @click="$emit('centerAll')" :disabled="disabled">
            <span i-tabler-object-scan class="text-cyan-300"></span>
        </button>
        <div v-show="!disabled" class="p-1 absolute left-1/2 top-1/2 -translate-y-1/2 flex items-center h-8 rounded-r-full bg-slate-800/95 backdrop-blur-sm ring-1 ring-slate-600/50 transition-all duration-200 ease-out delay-500 group-hover:delay-0 w-0 opacity-0 group-hover:pl-5 group-hover:pr-1 group-hover:opacity-100" :class="is3D ? 'group-hover:w-28' : 'group-hover:w-21'">
            <!-- Center position -->
            <button type="button" title="Center Position" aria-label="Center Position"
                    class="aspect-square h-full flex items-center justify-center p-1 rounded-full ml-1.5 transition-all shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white"
                    @click="$emit('centerPosition')">
                <span i-tabler-location text-sm class="-mb-0.5"></span>
            </button>
            <!-- Reset zoom -->
            <button type="button" title="Reset Zoom" aria-label="Reset Zoom"
                    class="flex items-center justify-center p-1 rounded-full ml-1 transition-all shrink-0 bg-violet-600 hover:bg-violet-500 text-white"
                    @click="$emit('resetZoom')">
                <span i-tabler-zoom text-sm></span>
            </button>
            <!-- Reset rotation (3D only) -->
            <button v-if="is3D" type="button" title="Reset Rotation" aria-label="Reset Rotation"
                    class="flex items-center justify-center p-1 rounded-full ml-1 transition-all shrink-0 bg-amber-600 hover:bg-amber-500 text-white"
                    @click="$emit('resetRotation')">
                <span i-tabler-rotate-3d text-sm></span>
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

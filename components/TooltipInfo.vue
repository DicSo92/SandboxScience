<template>
    <button name="Info" aria-label="Info" i-tabler-info-circle text-zinc text-base cursor-help align-top
            v-tooltip="{ content: tooltip, html: true, container: container,
            popperClass: 'bg-gray-800 text-sm max-w-64 pointer-events-none', delay: 0,
            distance: 7, placement: 'auto-start', overflowPadding: 10, arrowPadding: 10 }">
    </button>
</template>

<script setup lang="ts">
defineProps({
    tooltip: {
        type: String,
        required: true
    },
    container: {
        type: String,
        default: 'body',
        required: false
    }
})
</script>

<style scoped>

</style>
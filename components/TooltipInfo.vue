<template>
    <component
        :is="tag" v-tooltip="{ content: tooltip,
                               html: true,
                               container,
                               popperClass: 'bg-slate-700/50 backdrop-blur-sm text-sm max-w-64 pointer-events-none rounded-md',
                               delay: 0,
                               distance: 7,
                               placement: 'auto-start',
                               overflowPadding: 10,
                               arrowPadding: 10 }" name="Info" aria-label="Info" i-tabler-info-circle inline-flex cursor-help align-top text-base
        text-zinc
    />
</template>

<script setup lang="ts">
defineProps({
    tooltip: {
        type: String,
        required: true,
    },
    container: {
        type: String,
        default: 'body',
        required: false,
    },
    tag: {
        type: String,
        default: 'button',
        required: false,
    },
})
</script>

<style>
.v-popper__popper {
}
.v-popper__inner {
}
</style>

<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
import { appName } from '~/constants'

useHead({
    titleTemplate: (titleChunk) => {
        return titleChunk ? `${titleChunk} - ${appName}` : appName;
    }
})
</script>

<style>
html, body, #__nuxt {
    height: auto; /* Allow height to expand with content */
    min-height: 100vh; /* Ensure it covers at least the viewport height */
}

html.dark {
    background: #222;
    color: white;
}
</style>

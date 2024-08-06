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
html,
body,
#__nuxt {
    height: 100vh;
}

html.dark {
    background: #222;
    color: white;
}
</style>

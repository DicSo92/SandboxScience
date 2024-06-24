<template>
    <nav class="flex py-2 px-3 bg-gray-800 z-100">
        <NuxtLink to="/">
            <div class="font-semibold">SandboxScience</div>
        </NuxtLink>
        <div class="ml-8 flex">
            <NuxtLink to="/game-of-life" class="mx-2">Game Of Life</NuxtLink>
            <NuxtLink to="/particle-life" class="mx-2">Particle Life</NuxtLink>
            <NuxtLink to="/hash-life" class="mx-2">Hash Life</NuxtLink>
        </div>
    </nav>
</template>

<script setup lang="ts">

</script>

<style scoped>
nav {
    box-shadow: 0 2px 8px 0 rgba(0,0,0,.5);
}
</style>
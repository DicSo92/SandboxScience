<template>
    <main class="h-auto min-h-screen flex flex-col">
        <NavBar v-show="!route.meta.hideNavBar" />
        <slot />
    </main>
</template>

<script setup lang="ts">
const route = useRoute()
</script>

<style scoped>

</style>

<template>
    <main class="h-full max-h-screen flex flex-col">
        <NavBar v-show="!route.meta.hideNavBar"></NavBar>
        <slot/>
    </main>
</template>

<script setup lang="ts">
const route = useRoute()
</script>

<style scoped>
main {

}
</style>
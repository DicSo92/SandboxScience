<template>
    <div flex-1 flex flex-col>
        <GameView />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'life'
})
const route = useRoute()
</script>

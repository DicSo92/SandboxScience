<template>
    <div flex-1 flex flex-col>
        <h1>
            Sandbox Science
        </h1>
        <h2>
            {{ route.meta.title }}
        </h2>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'life'
})
const route = useRoute()
</script>

<template>
    <div>
        <p>Current route: {{ route.path }}</p>
        <GameView />
    </div>
</template>

<script setup lang="ts">
const route = useRoute()

const user = useUserStore()
watchEffect(() => {
    // user.setNewName(route.params.id as string)
})
</script>

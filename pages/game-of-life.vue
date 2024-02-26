<template>
    <div>
        <button @click="game.sidebarRightOpen = true" class="px-4 py-2 bg-black text-white rounded-md"> Open SidebarRight </button>
        <SidebarRight v-model="sidebarRightOpen">
            <PatternList />
        </SidebarRight>
    </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import PatternList from "~/components/game-of-life/PatternList.vue";

export default defineComponent({
    components: { PatternList },
    setup() {
        definePageMeta({
            layout: 'life'
        })

        const game = useGameStore()
        const { sidebarRightOpen } = storeToRefs(useGameStore())



        return { game, sidebarRightOpen }
    }
})
</script>

<style scoped>

</style>
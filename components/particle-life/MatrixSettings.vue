<template>
    <div class="mx-auto">
        <div class="flex space-x-1 p-1 bg-zinc-700 rounded-lg shadow-md">
            <button @click="openTab = 1" :class="openTab === 1 ? 'bg-zinc-900' : 'hover:bg-zinc-800'" class="flex-1 py-1 rounded-lg focus:outline-none focus:shadow-outline-blue transition-all duration-100">
                Forces
            </button>
            <button @click="openTab = 2" :class="openTab === 2 ? 'bg-zinc-900' : 'hover:bg-zinc-800'" class="flex-1 py-1 rounded-lg focus:outline-none focus:shadow-outline-blue transition-all duration-100">
                Min. Radius
            </button>
            <button @click="openTab = 3" :class="openTab === 3 ? 'bg-zinc-900' : 'hover:bg-zinc-800'" class="flex-1 py-1 rounded-lg focus:outline-none focus:shadow-outline-blue transition-all duration-100">
                Max. Radius
            </button>
        </div>

        <div mt-2>
            <div v-if="openTab === 1" class="p-2 rounded-lg shadow-md bg-zinc-700">
                <RulesMatrix @update="(...args) => $emit('updateRulesMatrix', ...args)" />
                <button type="button" btn p2 mx-1 mt-2 flex items-center rounded-xl bg="zinc-800 hover:zinc-900" @click="$emit('randomRulesMatrix')">
                    <span i-game-icons-perspective-dice-six-faces-random text-xl></span>
                    <span class="ml-2 mr-1">Randomize</span>
                </button>
            </div>

            <div v-if="openTab === 2" class="p-2 rounded-lg shadow-md bg-zinc-700">
                <MinMatrix @update="(...args) => $emit('updateMinMatrix', ...args)" />
            </div>

            <div v-if="openTab === 3" class="p-2 rounded-lg shadow-md bg-zinc-700">
                <MaxMatrix @update="(...args) => $emit('updateMaxMatrix', ...args)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RulesMatrix from "~/components/particle-life/RulesMatrix.vue";
import MinMatrix from "~/components/particle-life/MinMatrix.vue";
import MaxMatrix from "~/components/particle-life/MaxMatrix.vue";
export default defineComponent({
    components: { MaxMatrix, MinMatrix, RulesMatrix },
    setup(props, { emit }) {
        const particleLife = useParticleLifeStore()

        const openTab = ref(1)

        return { particleLife, openTab }
    }
})
</script>

<style scoped>

</style>
<template>
    <div class="mx-auto">
        <div class="flex space-x-1 p-1 bg-slate-700/80 rounded-lg shadow-md">
            <button key="tab-1" @click="openTab = 1" :class="openTab === 1 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="pl-1 text-sm flex-1 py-1 rounded-lg focus:outline-none focus:shadow-outline-blue transition-all duration-100">
                Forces
                <TooltipInfo container="#mainContainer" tag="div"
                             tooltip="Displays a grid representing interaction forces between color pairs. <br>
                             Click on a cell to adjust the force value for the interaction between the two colors it represents.">
                </TooltipInfo>
            </button>
            <button key="tab-2" @click="openTab = 2" :class="openTab === 2 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="pl-1 text-sm flex-1 py-1 rounded-lg focus:outline-none focus:shadow-outline-blue transition-all duration-100">
                Min. Radius
                <TooltipInfo container="#mainContainer" tag="div"
                             tooltip="Displays a grid representing the minimum interaction radius for color pairs. <br>
                             Click on a cell to set the minimum distance at which particles of the two colors will start to interact.">
                </TooltipInfo>
            </button>
            <button key="tab-3" @click="openTab = 3" :class="openTab === 3 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="pl-1 text-sm flex-1 py-1 rounded-lg focus:outline-none focus:shadow-outline-blue transition-all duration-100">
                Max. Radius
                <TooltipInfo container="#mainContainer" tag="div"
                             tooltip="Displays a grid representing the maximum interaction radius for color pairs. <br>
                             Click on a cell to set the maximum distance at which particles of the two colors will influence each other. <br>
                             Increasing this value can impact performance.">
                </TooltipInfo>
            </button>
        </div>

        <div mt-2>
            <div v-if="openTab === 1" class="p-2 rounded-lg shadow-md bg-slate-700/40">
                <RulesMatrix :store="particleLife" @update="(...args) => $emit('updateRulesMatrix', ...args)" />
<!--                <button type="button" btn p2 mt-2 flex items-center rounded-xl bg="slate-700/40 hover:slate-700/40" @click="$emit('randomRulesMatrix')">-->
<!--                    <span i-game-icons-perspective-dice-six-faces-random text-lg></span>-->
<!--                    <span class="ml-2 mr-1 text-sm">Randomize</span>-->
<!--                </button>-->
            </div>

            <div v-if="openTab === 2" class="p-2 rounded-lg shadow-md bg-slate-700/40">
                <MinMatrix :store="particleLife" @update="(...args) => $emit('updateMinMatrix', ...args)" />
            </div>

            <div v-if="openTab === 3" class="p-2 rounded-lg shadow-md bg-slate-700/40">
                <MaxMatrix :store="particleLife" @update="(...args) => $emit('updateMaxMatrix', ...args)" />
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
    props: {
        store: {
            type: Object,
            required: true,
        }
    },
    setup(props, { emit }) {
        const particleLife = props.store

        const openTab = ref<number>(1)

        return { particleLife, openTab }
    }
})
</script>

<style scoped>

</style>
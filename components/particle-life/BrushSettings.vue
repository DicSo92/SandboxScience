<template>
    <div class="faded-hover-effect">
        <button type="button" btn w-8 aspect-square rounded-full p1 flex items-center justify-center
                :class="particleLife.isBrushActive && particleLife.brushType === 1 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-zinc-800 hover:bg-zinc-700'"
                @click="toggleBrushType(1)">
            <span i-tabler-brush text-sm></span>
        </button>
        <button type="button" btn w-8 aspect-square rounded-full p1 flex items-center justify-center
                :class="particleLife.isBrushActive && particleLife.brushType === 0 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-zinc-800 hover:bg-zinc-700'"
                @click="toggleBrushType(0)">
            <span i-tabler-eraser text-sm></span>
        </button>
        <button type="button" btn w-8 aspect-square rounded-full p1 flex items-center justify-center
                :class="particleLife.isBrushActive && particleLife.brushType === 3 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-zinc-800 hover:bg-zinc-700'"
                @click="toggleBrushType(3)">
            <span i-tabler-magnetic text-sm></span>
        </button>
        <button type="button" btn w-8 aspect-square rounded-full p1 flex items-center justify-center
                :class="particleLife.isBrushActive && particleLife.brushType === 2 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-zinc-800 hover:bg-zinc-700'"
                @click="toggleBrushType(2)">
            <span i-tabler-magnet text-sm></span>
        </button>
        <div class="settings-btn">
            <button type="button" btn w-8 aspect-square rounded-full p1 flex items-center justify-center bg="zinc-800 hover:zinc-700">
                <span i-tabler-settings text-sm></span>
            </button>
            <div absolute class="settings-panel pr-1 left-0 top-0 -translate-x-full">
                <div p-3 pl-4 bg-zinc-800 w-64 rounded-lg text-left>
                    <p underline mb-2>Brush Settings :</p>
                    <div text-gray-300>
                        <div flex items-center mb-2>
                            <p mr-2 class="w-1/4">Radius</p>
                            <div flex-1>
                                <RangeInput input :min="10" :max="1000" :step="1" v-model="particleLife.brushRadius" />
                            </div>
                        </div>
                        <div flex items-center mb-2>
                            <p mr-2 class="w-1/4">Intensity</p>
                            <div flex-1>
                                <RangeInput input :min="1" :max="100" :step="1" v-model="particleLife.brushIntensity" />
                            </div>
                        </div>
                        <div flex items-center mb-2>
                            <p mr-2 class="w-1/4">Attract</p>
                            <div flex-1>
                                <RangeInput input :min="1" :max="100" :step="1" v-model="particleLife.attractForce" />
                            </div>
                        </div>
                        <div flex items-center>
                            <p mr-2 class="w-1/4">Repulse</p>
                            <div flex-1>
                                <RangeInput input :min="1" :max="100" :step="1" v-model="particleLife.repulseForce" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div flex flex-col p1 rounded-full bg-gray-8>
            <button w-6 aspect-square rounded-full class="rainbow"
                 :class="!particleLife.brushes.length && 'border-3 border-gray-400 shadow-inner'"
                 @click="toggleBrushColor(null)">
            </button>
            <hr mt-1 border-gray-600>
            <button v-for="(color, index) in particleLife.currentColors" :key="index"
                 w-6 aspect-square rounded-full mt-1 :class="particleLife.brushes.includes(index) && 'border-3 border-gray-950 shadow-inner'"
                 :style="{ backgroundColor: `hsl(${color}, 100%, 50%, 1)`}"
                 @click="toggleBrushColor(index)">
            </button>
        </div>
    </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    setup(props, { emit }) {
        const particleLife = useParticleLifeStore()

        function toggleBrushType(brushType: number) {
            if (particleLife.isBrushActive && particleLife.brushType === brushType) {
                particleLife.isBrushActive = false
            } else {
                particleLife.brushType = brushType
                particleLife.isBrushActive = true
            }
        }
        function toggleBrushColor(index: number | null) {
            particleLife.isBrushActive = true
            if (index === null) {
                particleLife.brushes = []
                return
            }
            const idx = particleLife.brushes.indexOf(index)
            if (idx === -1) {
                particleLife.brushes.push(index)
            } else {
                particleLife.brushes.splice(idx, 1)
            }
        }

        return { particleLife, toggleBrushType, toggleBrushColor }
    }
})
</script>

<style scoped>
.rainbow {
    background: conic-gradient(
        hsl(360, 100%, 50%),
        hsl(315, 100%, 50%),
        hsl(270, 100%, 50%),
        hsl(225, 100%, 50%),
        hsl(180, 100%, 50%),
        hsl(135, 100%, 50%),
        hsl(90, 100%, 50%),
        hsl(45, 100%, 50%),
        hsl(0, 100%, 50%)
    );
}
.settings-btn {
    position: relative;
    &:hover {
        .settings-panel {
            display: block;
        }
    }
}
.settings-panel {
    display: none;
    z-index: 100;
}
</style>

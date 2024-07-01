<template>
    <div class="brush-settings">
        <button type="button" btn w-8 aspect-square rounded-full p1 flex items-center justify-center
                :class="particleLife.isBrushActive ? 'bg-blue-900 hover:bg-gray-700' : 'bg-#212121 hover:bg-#333333'"
                @click="particleLife.isBrushActive = !particleLife.isBrushActive">
            <span i-tabler-brush text-sm></span>
        </button>
        <button type="button" btn w-8 aspect-square rounded-full p1 flex items-center justify-center bg="#212121aa hover:#333333aa">
            <span i-tabler-settings text-sm></span>
        </button>
        <div flex flex-col p1 rounded-full bg-gray-8>
            <button w-6 aspect-square rounded-full class="rainbow"
                 :class="!particleLife.brushes.length && 'border-3 border-gray-400 shadow-inner'"
                 @click="toggleBrushColor(null)">
            </button>
            <hr mt-1 border-gray-600>
            <button v-for="(color, index) in particleLife.currentColors" :key="index"
                 w-6 aspect-square rounded-full mt-1 :class="particleLife.brushes.includes(index) && 'border-3 border-gray-400 shadow-inner'"
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

        return { particleLife, toggleBrushColor }
    }
})
</script>

<style scoped>
.brush-settings {
    transition: all 100ms ease-in-out;
    opacity: 40%;
    &:hover {
        opacity: 100%;
    }
}
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
</style>

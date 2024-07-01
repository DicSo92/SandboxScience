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
            <div w-6 aspect-square rounded-full class="rainbow"></div>
            <hr mt-1 border-gray-600>
            <div v-for="(color, index) in particleLife.currentColors" :key="index"
                 w-6 aspect-square rounded-full mt-1
                 :style="{ backgroundColor: `hsl(${color}, 100%, 50%, 1)`}">
            </div>
        </div>
    </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    setup(props, { emit }) {
        const particleLife = useParticleLifeStore()

        return { particleLife }
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

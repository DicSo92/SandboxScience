<template>
    <main class="flex">
        <SelectButton id="normal" label="Normal" v-model="currentValue" mr-2 />
        <SelectButton id="edges" label="Edges" v-model="currentValue" mr-2 />
        <SelectButton id="infinite" label="Infinite" v-model="currentValue" />
    </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    props: {
        store: {
            type: Object,
            required: true,
        }
    },
    setup(props, { emit }) {
        const currentValue = ref('normal')
        const particleLife = props.store

        onMounted(() => {
            if (particleLife.isMirrorWrap) {
                currentValue.value = 'edges'
            } else if (particleLife.isInfiniteMirrorWrap) {
                currentValue.value = 'infinite'
            } else {
                currentValue.value = 'normal'
            }
        })

        watch(() => currentValue.value, (value) => {
            if (value === 'edges') {
                particleLife.isMirrorWrap = true
            } else if (value === 'infinite') {
                particleLife.isInfiniteMirrorWrap = true
            } else {
                particleLife.isMirrorWrap = false
                particleLife.isInfiniteMirrorWrap = false
            }
        })

        watch([() => particleLife.isMirrorWrap, () => particleLife.isInfiniteMirrorWrap], () => {
            if (particleLife.isMirrorWrap) {
                currentValue.value = 'edges'
            } else if (particleLife.isInfiniteMirrorWrap) {
                currentValue.value = 'infinite'
            } else {
                currentValue.value = 'normal'
            }
        })

        return { currentValue }
    }
})
</script>

<style scoped>

</style>

<template>
    <main class="flex">
        <SelectButton id="normal" v-model="currentValue" label="Normal" mr-2 />
        <SelectButton id="edges" v-model="currentValue" label="Edges" mr-2 />
        <SelectButton id="infinite" v-model="currentValue" label="Infinite" />
    </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        store: {
            type: Object,
            required: true,
        },
    },
    // eslint-disable-next-line unused-imports/no-unused-vars
    setup(props, { emit }) {
        const currentValue = ref('normal')
        const particleLife = props.store

        onMounted(() => {
            if (particleLife.isMirrorWrap) {
                currentValue.value = 'edges'
            }
            else if (particleLife.isInfiniteMirrorWrap) {
                currentValue.value = 'infinite'
            }
            else {
                currentValue.value = 'normal'
            }
        })

        watch(() => currentValue.value, (value) => {
            if (value === 'edges') {
                particleLife.isMirrorWrap = true
            }
            else if (value === 'infinite') {
                particleLife.isInfiniteMirrorWrap = true
            }
            else {
                particleLife.isMirrorWrap = false
                particleLife.isInfiniteMirrorWrap = false
            }
        })

        watch([() => particleLife.isMirrorWrap, () => particleLife.isInfiniteMirrorWrap], () => {
            if (particleLife.isMirrorWrap) {
                currentValue.value = 'edges'
            }
            else if (particleLife.isInfiniteMirrorWrap) {
                currentValue.value = 'infinite'
            }
            else {
                currentValue.value = 'normal'
            }
        })

        return { currentValue }
    },
})
</script>

<style scoped>

</style>

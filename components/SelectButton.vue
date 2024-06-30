<template>
    <button @click="select" :class="modelValue === id ? 'bg-blue-500' : 'bg-gray-500'" rounded p1>
        {{ label }}
    </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        id: {
            type: [Number, String],
            required: true
        },
        label: {
            type: String,
            required: true
        },
        modelValue: {
            type: [Number, String],
            required: true
        }
    },
    setup(props, { emit }) {
        function select() {
            this.$emit('update:modelValue', props.id)
        }
        return { select }
    }

})
</script>

<style scoped>

</style>

<template>
    <button @click="select" :class="modelValue === id ? 'bg-gray-800' : 'bg-gray-600'" rounded px-2 py-1 text-sm>
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
            emit('update:modelValue', props.id)
        }
        return { select }
    }

})
</script>

<style scoped>

</style>

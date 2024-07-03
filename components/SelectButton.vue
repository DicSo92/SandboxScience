<template>
    <button @click="select" :class="modelValue === id ? 'bg-gray-800' : 'bg-gray-600'" flex items-center rounded px-2 py-1 text-sm>
        <span v-if="icon" :class="[icon, label && 'mr-1']"></span>
        {{ label || '' }}
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
            required: false
        },
        icon: {
            type: String,
            required: false
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

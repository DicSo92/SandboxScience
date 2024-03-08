<template>
    <div flex items-center>
        <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" @change="toggle" :value="modelValue" :checked="modelValue" :disabled="disabled">
            <span :class="disabled && 'cursor-not-allowed'" class="peer w-11 h-6 bg-gray-200 rounded-full dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></span>
        </label>
        <p ml-2>{{ label }}</p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    props: {
        label: {
            type: String,
            required: false
        },
        modelValue: {
            type: Boolean,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { emit }) {
        function toggle() {
            emit("update:modelValue", !props.modelValue)
        }
        return { toggle }
    }
})
</script>

<style scoped>

</style>
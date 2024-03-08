<template>
<!--    <label class="relative inline-flex cursor-pointer select-none items-center">-->
<!--        <input type="checkbox" class="sr-only" @change="handleCheckboxChange" :value="isChecked"/>-->
<!--        <span class="slider mx-4 flex h-8 w-[60px] items-center rounded-full bg-[#CCCCCE] p-1 duration-200">-->
<!--            <span class="dot h-6 w-6 rounded-full bg-white duration-200"></span>-->
<!--        </span>-->
<!--    </label>-->
    <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" class="sr-only peer" @change="toggle" :value="modelValue" :checked="modelValue">
        <span class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></span>
        <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{{ label }}</span>
    </label>
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
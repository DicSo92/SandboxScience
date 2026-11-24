<template>
    <div flex items-center>
        <p v-if="inactiveLabel" class="mr-2 pt-0.5 text-2sm" :class="(colorfulLabel && !modelValue) ? 'text-white font-600' : (colorfulLabel && modelValue) ? 'text-zinc-400 font-400' : ''">
            {{ inactiveLabel }}
            <TooltipInfo v-if="tooltip" container="#mainContainer" :tooltip="tooltip!" />
        </p>
        <label class="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" class="peer sr-only" :value="modelValue" :checked="modelValue" :disabled="disabled" @change="toggle">
            <span
                :class="disabled && 'cursor-not-allowed'"
                class="peer h-5.5 w-10 rounded-full bg-#07404B after:absolute after:start-[2px] after:top-0.5 after:h-4.5 after:w-4.5 after:border after:border-gray-300 after:rounded-full after:bg-gray-200 peer-checked:bg-#0C7489 after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:after:bg-white rtl:peer-checked:after:-translate-x-full"
            />
        </label>
        <p v-if="label" class="ml-2 pt-0.5 text-2sm" :class="(colorfulLabel && modelValue) ? 'text-white font-600' : (colorfulLabel && !modelValue) ? 'text-zinc-400 font-400' : ''">
            {{ label }}
            <TooltipInfo v-if="tooltip" container="#mainContainer" :tooltip="tooltip!" />
        </p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        inactiveLabel: {
            type: String,
            required: false,
        },
        label: {
            type: String,
            required: false,
        },
        modelValue: {
            type: Boolean,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        colorfulLabel: {
            type: Boolean,
            default: false,
        },
        tooltip: {
            type: String,
            required: false,
        },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        function toggle() {
            emit("update:modelValue", !props.modelValue)
        }
        return { toggle }
    },
})
</script>

<style scoped>

</style>

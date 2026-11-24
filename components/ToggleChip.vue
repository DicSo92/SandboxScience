<template>
    <label class="relative inline-block" :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'">
        <input type="checkbox" class="peer sr-only" :checked="modelValue" :disabled="disabled" @change="toggle">

        <span
            class="w-full flex items-center justify-between gap-3 border rounded-lg px-1.5 py-1 text-xs font-medium shadow-sm transition transition-duration-75 peer-focus-visible:outline-2 peer-focus-visible:outline-sky-500 peer-focus-visible:outline"
            :class="disabled ? disabledClass : (modelValue ? activeClass : inactiveClass)"
        >

            <span flex items-center>
                <span v-if="icon" class="text-sm" :class="icon" mr-2 />
                <span>{{ label }}</span>
            </span>

            <span class="text-sm" :class="modelValue ? 'i-tabler-circle-check text-green-600' : 'i-tabler-circle'" />
        </span>
    </label>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
    name: "ToggleChip",
    props: {
        modelValue: { type: Boolean, required: true },
        label: { type: String, required: true },
        icon: { type: String, default: "" },
        activeClass: {
            type: String,
            default: "border-sky-600 bg-sky-600/20 text-sky-100",
        },
        inactiveClass: {
            type: String,
            default: "border-slate-600 bg-slate-800/80 hover:bg-slate-900/50 text-slate-300",
        },
        disabledClass: {
            type: String,
            default: "border-slate-700 bg-slate-800/60 text-slate-400",
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["update:modelValue"],
    setup(props, { emit }) {
        const toggle = () => {
            emit("update:modelValue", !props.modelValue)
        }

        return { toggle }
    },
})
</script>

<style scoped>

</style>

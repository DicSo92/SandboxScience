<template>
    <div class="grid w-full gap-1 rounded-xl bg-slate-700/80 p-0.75 text-sm" :style="{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }">
        <div v-for="option in options" :key="option.id">
            <input
                :id="`${name}-${option.id}`" type="radio" :name="name" :value="option.id"
                :checked="modelValue === option.id"
                class="peer hidden"
                @change="$emit('update:modelValue', option.id)"
            >
            <label
                :for="`${name}-${option.id}`"
                class="block cursor-pointer select-none rounded-lg px-2 text-center hover:bg-slate-800/80 peer-checked:bg-slate-900/80 peer-checked:text-white peer-checked:font-bold"
            >
                <span v-if="option.icon" :class="[option.icon, option.label && 'mr-1']" />
                {{ option.label }}
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    name: string
    options: { id: string | number, label: string, icon?: string }[]
    modelValue: string | number
}>()

defineEmits<{
    'update:modelValue': [value: string | number]
}>()
</script>

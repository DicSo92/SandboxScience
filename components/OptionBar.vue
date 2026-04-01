<template>
    <div class="grid w-full rounded-xl bg-slate-700/80 text-sm gap-1 p-0.75" :style="{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }">
        <div v-for="option in options" :key="option.id">
            <input type="radio" :name="name" :id="`${name}-${option.id}`" :value="option.id"
                :checked="modelValue === option.id"
                @change="$emit('update:modelValue', option.id)"
                class="peer hidden"
            />
            <label :for="`${name}-${option.id}`"
                class="block cursor-pointer select-none rounded-lg px-2 text-center hover:bg-slate-800/80 peer-checked:bg-slate-900/80 peer-checked:font-bold peer-checked:text-white">
                <span v-if="option.icon" :class="[option.icon, option.label && 'mr-1']"></span>
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

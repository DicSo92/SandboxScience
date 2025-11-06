<template>
    <div ref="container" class="relative inline-block w-full max-w-64">
        <button type="button" class="flex items-center gap-2 w-full select-none rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1 text-left text-sm shadow-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                @click="toggle()" :aria-expanded="isOpen" aria-haspopup="listbox" :aria-controls="`listbox-${name}`" :disabled="disabled">
                <span v-if="selectedOption?.icon" :class="`i-${selectedOption.icon}`"></span>
                <span class="truncate" v-text="selectedOption ? selectedOption.name : placeholder"/>
                <span class="ml-auto i-tabler-chevron-up transition-transform" :class="!isOpen && 'rotate-180'" />
        </button>

        <transition name="fade" appear>
            <div v-if="isOpen" class="absolute z-100 mt-2 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-lg">
                <ul :id="`listbox-${name}`" role="listbox" tabindex="-1" ref="listboxEl" @keydown.esc.prevent="close()"
                    class="max-h-128 overflow-auto py-1 text-sm outline-none">
                    <template v-for="(group, groupId) in groupedOptions" :key="groupId">
                        <li class="px-3 py-1.5 text-xs font-semibold text-slate-400 select-none" aria-hidden="true">
                            {{ group.category || defaultCategoryLabel }}
                        </li>
                        <li v-for="option in group.items" :key="option.id" role="option"
                            :data-index="option.id" :aria-selected="isSelected(option.id)" @click="select(option)"
                            class="cursor-pointer select-none px-3 py-2 flex items-center gap-2 hover:bg-slate-700"
                            :class="[isSelected(option.id) && 'font-medium bg-slate-600']">
                            <span v-if="option.icon" :class="`i-${option.icon}`"></span>
                            <span class="truncate">{{ option.name }}</span>
                            <span v-if="isSelected(option.id)" class="ml-auto i-tabler-check" aria-hidden="true" />
                        </li>
                        <li v-if="groupId < groupedOptions.length - 1" class="my-1 border-t border-slate-500" aria-hidden="true" />
                    </template>
                </ul>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { onClickOutside } from "@vueuse/core";

export type SelectOption = {
    id: string | number
    name: string
    icon?: string
    category?: string | null
}

export default defineComponent({
    name: 'SelectInput',
    props: {
        options: {
            type: Array as () => SelectOption[],
            required: true,
        },
        modelValue: {
            type: [Number, String],
            required: true,
        },
        placeholder: {
            type: String,
            default: 'Select…',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        defaultCategoryLabel: {
            type: String,
            default: 'Others',
        },
        name: {
            type: String,
            default: 'select-input',
        },
    },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
        const isOpen = ref(false)
        const container = ref(null)
        const listboxEl = ref<HTMLElement | null>(null)

        const selectedOption = computed(() => props.options.find(o => o.id === props.modelValue))
        const groupedOptions = computed(() => {
            const groups: { category: string | null, items: SelectOption[] }[] = []
            for (const opt of props.options) {
                const cat = (opt.category ?? '').trim()
                const category = cat || null

                let group = groups.find(g => g.category === category)
                if (!group) {
                    group = { category, items: [] }
                    groups.push(group)
                }
                group.items.push({ ...opt })
            }
            return groups
        })
        const select = (option: SelectOption) => {
            emit('update:modelValue', option.id)
            emit('change', option.id)
            close()
        }
        const isSelected = (id: string | number) => id === props.modelValue
        let stopClickOutside: () => void = () => {};
        const toggle = () => {
            isOpen.value = !isOpen.value
            if (isOpen.value) {
                nextTick(() => {
                    stopClickOutside = onClickOutside(container, (event) => {
                        console.log("Click Outside SelectInput !", event)
                        close()
                    })
                    scrollSelectedIntoView()
                })
            } else {
                stopClickOutside()
            }
        }
        const close = () => {
            stopClickOutside()
            isOpen.value = false
        }
        const scrollSelectedIntoView = () => {
            const item = listboxEl.value?.querySelector<HTMLElement>(`[data-index='${props.modelValue}']`)
            item?.scrollIntoView({ block: 'center' })
        }

        return {
            isOpen, container, listboxEl,
            groupedOptions, selectedOption,
            isSelected, toggle, close, select,
        }
    },
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 120ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

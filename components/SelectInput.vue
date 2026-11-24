<template>
    <div ref="container" class="relative inline-block max-w-64 w-full">
        <button
            type="button" class="w-full flex select-none items-center gap-2 border border-slate-700 rounded-lg bg-slate-800/80 px-3 py-1 text-left text-sm shadow-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            :aria-expanded="isOpen" aria-haspopup="listbox" :aria-controls="`listbox-${name}`" :disabled="disabled" @click="toggle()"
        >
            <span v-if="selectedOption?.icon" :class="selectedOption.icon" />
            <span class="truncate" v-text="selectedOption ? selectedOption.name : placeholder" />
            <span class="i-tabler-chevron-up ml-auto transition-transform" :class="!isOpen && 'rotate-180'" />
        </button>

        <transition name="fade" appear>
            <div v-if="isOpen" class="absolute z-100 mt-2 w-full overflow-hidden border border-slate-700 rounded-lg bg-slate-800/90 shadow-lg backdrop-blur-sm">
                <ul
                    :id="`listbox-${name}`" ref="listboxEl" role="listbox" tabindex="-1" class="max-h-128 overflow-auto py-1 text-sm outline-none"
                    @keydown.esc.prevent="close()"
                >
                    <template v-for="(group, groupId) in groupedOptions" :key="groupId">
                        <li class="select-none px-3 py-1.5 text-xs text-slate-400 font-semibold" aria-hidden="true">
                            {{ group.category || defaultCategoryLabel }}
                        </li>
                        <li
                            v-for="option in group.items" :key="option.id" role="option"
                            :data-index="option.id" :aria-selected="isSelected(option.id)" class="flex cursor-pointer select-none items-center gap-2 px-3 py-2 hover:bg-slate-700"
                            :class="[isSelected(option.id) && 'font-medium bg-slate-600']"
                            @click="select(option)"
                        >
                            <span v-if="option.icon" :class="option.icon" />
                            <span class="truncate">{{ option.name }}</span>
                            <span v-if="isSelected(option.id)" class="i-tabler-check ml-auto" aria-hidden="true" />
                        </li>
                        <li v-if="groupId < groupedOptions.length - 1" class="my-1 border-t border-slate-500" aria-hidden="true" />
                    </template>
                </ul>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { onClickOutside } from "@vueuse/core"
import { defineComponent } from 'vue'

export interface SelectOption {
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
        let stopClickOutside: () => void = () => {}
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
            }
            else {
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
            isOpen,
            container,
            listboxEl,
            groupedOptions,
            selectedOption,
            isSelected,
            toggle,
            close,
            select,
        }
    },
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 120ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

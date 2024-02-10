<template>
    <div>
<!--        <label id="listbox-label" class="block text-sm font-medium leading-6">{{ label }}</label>-->
        <div class="relative mt-1">
            <button type="button" @click="opened = !opened"
                    class="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6" aria-haspopup="listbox" aria-expanded="true" aria-labelledby="listbox-label">
                <span class="flex items-center">
                    <span w-4 :class="selectedIcon"></span>
                    <span class="ml-3 block truncate">{{ selectedName }}</span>
                </span>
                <span class="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                    <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
                    </svg>
                </span>
            </button>

            <transition leave-active-class="transition ease-out duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0"
                        enter-active-class="transition ease-in duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100">
                <ul v-if="opened" class="absolute z-100 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" tabindex="-1" role="listbox" aria-labelledby="listbox-label" aria-activedescendant="listbox-option-3">
                    <li v-for="(option, index) in options" @click.capture="select(option.id)"
                        class="text-gray-900 hover:text-white hover:bg-indigo-600 relative cursor-default select-none py-2 pl-3 pr-9"
                        :id="`listbox-option-${index}`" role="option">
                        <div class="flex items-center">
                            <span w-4 :class="option.icon"></span>
                            <span class="ml-3 block truncate">{{ option.name }}</span>
                        </div>

                        <span class="absolute inset-y-0 right-0 flex items-center pr-4" :class="option.id === selected ? 'text-indigo-600' : 'text-transparent'">
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                        </span>
                    </li>
                </ul>
            </transition>
        </div>
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
        options: {
            // type array of objects
            type: Array<any>,
            required: true
        },
        selected: {
            type: String || Number,
            required: true
        }
    },
    setup(props, { emit }) {
        const selectedName = computed(() => props.options.find((option: any) => option.id === props.selected)?.name)
        const selectedIcon = computed(() => props.options.find((option: any) => option.id === props.selected)?.icon)

        const opened = ref(false)

        function select(id: string | number) {
            opened.value = false
            emit('selected', id)
        }

        return { selectedName, selectedIcon, opened, select }
    }

})

</script>

<style scoped>

</style>
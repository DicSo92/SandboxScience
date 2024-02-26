<template>
    <Transition enter-active-class="transform transition-transform ease-out duration-250"
                enter-from-class="translate-x-full"
                enter-to-class="translate-x-0"
                leave-active-class="transform transition-transform ease-in duration-250"
                leave-from-class="translate-x-0"
                leave-to-class="translate-x-full">
        <div v-show="modelValue" class=" fixed inset-y-0 right-0 pl-10 max-w-full flex overflow-hidden">
            <div class="h-full flex flex-col py-6 bg-white shadow-xl">
                <div class="flex items-center justify-between px-4">
                    <h2 class="text-xl font-semibold text-black">Search</h2>
                    <button @click="close" class="text-gray-500 hover:text-gray-700">
                        <span class="sr-only">Close</span>
                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <slot></slot>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    props: {
        modelValue: {
            type: Boolean,
            required: true
        }
    },
    setup(props, { emit }) {
        const game = useGameStore()

        function close() {
            emit("update:modelValue", Boolean(false))
        }


        return { game, close }
    }
})
</script>

<style scoped>

</style>
<template>
    <div>
        <button rounded-full btn my-3 mx-1 flex items-center fixed right-0 z-10 p-4 id="sidebarBtn"
             :style="toggleBtnStyle"
             bg="gray-800 hover:gray-900" @click="toggle">
            <span i-tabler-list-details text-2xl></span>
        </button>
        <Transition enter-active-class="transform transition-transform ease-out duration-300"
                    enter-from-class="translate-x-full"
                    enter-to-class="translate-x-0"
                    leave-active-class="transform transition-transform ease-in duration-200"
                    leave-from-class="translate-x-0"
                    leave-to-class="translate-x-full">
            <div v-show="modelValue" :style="`width: ${sidebarWidth}px`"
                 class="z-50 fixed inset-y-0 right-0 max-w-full max-h-full flex overflow-hidden border-l border-gray-400"> <!-- inset-y-0 for fullheight sidebar -->
                <div class="h-full w-full flex flex-col pb-4 pt-12 bg-gray-600 shadow-xl">
                    <slot></slot>
                </div>
            </div>
        </Transition>
    </div>
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
        const sidebarWidth = ref(400)

        function toggle() {
            emit("update:modelValue", !props.modelValue)
        }

        const toggleBtnStyle = computed(() => {
            return {
                transition: `right 0.3s ${props.modelValue ? 'ease-out' : 'ease-in'}`,
                // transition: `right 0.3s ease-out`,
                right: `${props.modelValue ? sidebarWidth.value : 0}px`
            }
        })


        return { game, toggle, toggleBtnStyle, sidebarWidth }
    }
})
</script>

<style scoped>
#sidebarBtn {

}
</style>
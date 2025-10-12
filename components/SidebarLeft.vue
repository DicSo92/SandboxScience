<template>
    <div id="sidebarLeft" class="faded-hover-effect z-50">
        <div fixed left-0 z-10 :style="toggleBtnStyle">
            <NuxtLink to="/" title="Home" aria-label="Home">
                <button type="button" name="Home" aria-label="Home" rounded-br-3xl btn flex items-center p-2 class="-mt-0.5 -ml-1 mr-px" bg="gray-800 hover:gray-900">
                    <span class="i-custom:icon text-2xl"></span>
                </button>
            </NuxtLink>
        </div>
        <div absolute left-0 class="top-13 z-10" :style="toggleBtnStyle">
            <button type="button" title="Settings" aria-label="Settings" rounded-r-3xl btn flex items-center pr-2 class="pl-0.5 py-[14px]" bg="gray-800 hover:gray-900" @click="toggle">
                <span i-tabler-settings text-lg></span>
            </button>
        </div>

<!--        <div my-3 mx-1 fixed left-0 z-10 :style="toggleBtnStyle" >-->
<!--            <button rounded-full btn flex items-center p-4 id="sidebarLeftBtn" bg="gray-800 hover:gray-900" @click="toggle">-->
<!--                <span i-tabler-settings text-2xl></span>-->
<!--            </button>-->
<!--            <slot name="controls"></slot>-->
<!--        </div>-->
        <Transition enter-active-class="transform transition-transform ease-out duration-300"
                    enter-from-class="-translate-x-full"
                    enter-to-class="translate-x-0"
                    leave-active-class="transform transition-transform ease-in duration-200 delay-75"
                    leave-from-class="translate-x-0"
                    leave-to-class="-translate-x-full">
            <div v-show="modelValue" :style="`width: ${sidebarWidth}px`"
                 class="z-50 fixed inset-y-0 left-0 max-w-full max-h-full flex border-r border-gray-400"> <!-- inset-y-0 for fullheight sidebar -->
                <div class="h-full w-full flex flex-col py-2 bg-zinc-700 shadow-xl">
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
        const sidebarWidth = ref(400)

        function toggle() {
            emit("update:modelValue", !props.modelValue)
        }

        const toggleBtnStyle = computed(() => {
            return {
                transition: `${props.modelValue ? 'left 0.3s ease-out' : 'left 0.2s ease-out'}`,
                left: `${props.modelValue ? sidebarWidth.value : 0}px`
            }
        })


        return { toggle, toggleBtnStyle, sidebarWidth }
    }
})
</script>

<style scoped>
#sidebarLeftBtn {}
</style>

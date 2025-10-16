<template>
    <div id="sidebarLeft" z-50> <!-- faded-hover-effect -->
        <div fixed left-0 z-40 :style="toggleBtnStyle">
            <NuxtLink to="/" title="Home" aria-label="Home">
                <button type="button" name="Home" aria-label="Home" rounded-br-3xl btn flex items-center p-2
                        class="-mt-0.5 -ml-1 mr-px ring-1 ring-slate-700 backdrop-blur-sm" bg="slate-900/85 hover:slate-950/85">
                    <span class="i-custom:icon text-2xl"></span>
                </button>
            </NuxtLink>
        </div>
        <div absolute left-0 top-13 z-40 :style="toggleBtnStyle">
            <button type="button" title="Settings" aria-label="Settings" rounded-r-3xl btn flex flex-col items-center pr-2
                    class="-ml-1 pl-2 py-[14px] ring-1 ring-slate-950 backdrop-blur-sm" bg="amber-700/85 hover:amber-800/85" @click="toggle">
                <span i-tabler-settings text-lg mb-1></span>
                <span class="vertical-90 rotate-180" text-sm>Settings</span>
            </button>
        </div>

<!--        <div my-3 mx-1 fixed left-0 z-40 :style="toggleBtnStyle" >-->
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
                 class="z-50 fixed inset-y-0 left-0 max-w-full max-h-full flex border-r border-slate-600/80"> <!-- inset-y-0 for fullheight sidebar -->
                <div class="h-full w-full flex flex-col py-2 bg-slate-950/70 backdrop-blur-md shadow-xl"> <!-- bg-slate-900/80 -->
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
        const toggleBtnStyle = computed(() => ({
            transition: props.modelValue
                ? 'transform 0.3s cubic-bezier(0, 0, 0.2, 1) 15ms'
                : 'transform 0.2s cubic-bezier(0.4, 0, 1, 1) 90ms',
            transform: `translateX(${props.modelValue ? sidebarWidth.value : 0}px)`
        }))


        return { toggle, toggleBtnStyle, sidebarWidth }
    }
})
</script>

<style scoped>
#sidebarLeftBtn {}
.vertical-90 {
    writing-mode: vertical-rl;
    text-orientation: sideways;
}
</style>

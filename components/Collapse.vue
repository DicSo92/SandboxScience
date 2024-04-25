<template>
    <section w-full>
        <div py-1 px-4 flex justify-between items-center bg-gray-800 cursor-pointer rounded-full relative z-50
             @click="toggle" :class="isOpen && 'shadow-lg'">
            <div flex items-center>
                <div v-if="icon" :class="icon" text-lg mr-2></div>
                <p>{{ label }}</p>
            </div>
            <div :class="isOpen && 'rotate-180'" class="icon i-tabler-caret-up-filled" text-2xl></div>
        </div>
        <transition name="collapse">
            <div v-show="isOpen" class="content -mt-4" p-2 bg-gray-700 pt-6 rounded-b-lg relative z-40>
                <slot></slot>
            </div>
        </transition>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    props: {
        icon: {
            type: String,
            required: false
        },
        label: {
            type: String,
            required: true
        },
        opened: {
            type: Boolean,
            required: false
        }
    },
    setup(props) {
        const isOpen = ref(false)

        onMounted(() => {
            if (props.opened) {
                isOpen.value = true
            }
        })
        function toggle() {
            isOpen.value = !isOpen.value
        }
        return { isOpen, toggle }
    }

})
</script>

<style scoped>
.icon {
    transition: transform 0.3s;
}
.content {

}
</style>
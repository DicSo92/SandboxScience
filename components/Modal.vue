<template>
    <transition name="modal-overlay-animation">
        <div v-if="modalActive" class="modal-overlay" :class="[overlayColor]">
            <transition name="modal-container-animation">
                <div v-show="modalActive" class="modal-container" ref="modalContainer">
                    <button type="button" title="Close" aria-label="Close"
                            btn absolute top-5 right-5 w-10 aspect-square rounded-full p1 flex items-center justify-center
                            class="text-gray-300 hover:text-gray-100"
                            @click="close()">
                        <span i-tabler-x text-xl></span>
                    </button>
                    <slot />
                </div>
            </transition>
        </div>
    </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { onClickOutside } from '@vueuse/core'
export default defineComponent({
    props: {
        modalActive: {
            type: Boolean,
            required: true
        },
        overlayColor: { // Define mask background, must be a bg color class
            type: String,
            default: "bg-gray-900/50"
        },
    },
    setup(props, { emit }) {
        const modalContainer = ref(null)

        const stopClickOutside = onClickOutside(modalContainer, (event) => {
            console.log("Click Outside Modal !", event)
            close()
        })

        const close = () => {
            stopClickOutside()
            emit("close")
        }

        return { close, modalContainer }
    }
})
</script>

<style lang="scss" scoped>
.modal-overlay {
    @apply fixed top-0 left-0 w-screen h-screen flex items-center justify-center;
    z-index: 100000;
    .modal-container {
        @apply relative rounded-xl w-4/5 max-w-[640px] p-14 bg-zinc-800;
        box-shadow: 0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22);
        //box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
}

.modal-overlay-animation-enter-active,
.modal-overlay-animation-leave-active {
    transition: opacity 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}
.modal-overlay-animation-enter-from,
.modal-overlay-animation-leave-to {
    opacity: 0;
}

.modal-container-animation-enter-active {
    transition: all 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02) 0.15s;
}
.modal-container-animation-leave-active {
    transition: all 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}
.modal-container-animation-enter-from {
    opacity: 0;
    transform: scale(0.8);
}
.modal-container-animation-leave-to {
    transform: scale(0.8);
}
</style>
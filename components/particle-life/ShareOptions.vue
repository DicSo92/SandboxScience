<template>
    <section absolute w-full h-full>
        <ParticleLifeCaptureOverlay ref="captureOverlay" v-if="isCaptureOverlayOpen"
                                    :getSelectedAreaImageData="getSelectedAreaImageData"
                                    @captureComplete="onCaptureComplete">>
        </ParticleLifeCaptureOverlay>

        <Modal :modalActive="modalActive" @close="closeModal">
            <div class="modal-content">
                <div flex items-center>
                    <span i-tabler-screenshot text-2xl mr-2></span>
                    <h1 text-xl>Choose Capture Mode</h1>
                </div>
                <hr mb-4>
                <section>
                    <div v-if="imageURL" class="w-3/4" relative bg-zinc-900 flex justify-center items-center rounded-lg p-1.5 border-2 border-gray-500 border-dashed>
                        <img :src="imageURL" alt="" w-full aspect-video object-scale-down object-center rounded>
                        <button type="button" title="Delete Capture" aria-label="Delete Capture" @click="imageURL = null"
                                absolute top-2 right-2 aspect-square rounded-full p-1 flex justify-center items-center
                                class="bg-red-800 hover:bg-red-700">
                            <span i-tabler-trash text-lg></span>
                        </button>
                    </div>
                    <div v-else flex>
                        <div flex items-center h-48 class="w-3/4">
                            <button type="button" title="Screenshot" aria-label="Screenshot"
                                    flex-1 h-full rounded-xl px-4 py-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-500 text-gray-300
                                    class="bg-zinc-800 hover:bg-zinc-700" @click="onChooseCaptureMode('screenshot')">
                                <span i-tabler-camera text-2xl></span>
                                Screenshot
                            </button>
                            <hr class="h-5/6" border-l-1 border-gray-500 border-dashed mx-3 py-8>
                            <button type="button" title="GIF Capture" aria-label="GIF Capture"
                                    flex-1 h-full rounded-xl px-4 py-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-500 text-gray-300
                                    class="bg-zinc-800 hover:bg-zinc-700" @click="onChooseCaptureMode('GIF')">
                                <span i-tabler-movie text-2xl></span>
                                GIF Capture
                            </button>
                        </div>
                        <div class="w-1/4">

                        </div>
                    </div>
                </section>
            </div>
        </Modal>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        getSelectedAreaImageData: {
            type: Function as PropType<(x: number, y: number, width: number, height: number) => ImageData>,
            required: true
        }
    },
    setup(props, { emit }) {
        const particleLife = useParticleLifeStore()
        const captureOverlay = ref(null)

        const modalActive = ref(false)
        const isCaptureOverlayOpen = ref(false)

        const imageURL = ref<string | null>(null)
        // -------------------------------------------------------------------------------------------------------------
        onMounted(() => {
            openModal()
        })
        // -------------------------------------------------------------------------------------------------------------
        const openModal = () => {
            modalActive.value = true
            particleLife.sidebarLeftOpen = false
        }
        function closeModal() {
            modalActive.value = false
            setTimeout(() => {
                particleLife.isShareOptionsOpen = false
                particleLife.sidebarLeftOpen = true
            }, 300)
        }
        function onChooseCaptureMode(mode: string) {
            particleLife.captureType = mode
            modalActive.value = false
            isCaptureOverlayOpen.value = true
        }
        function onCaptureComplete(imageUrl: string) {
            isCaptureOverlayOpen.value = false
            imageURL.value = imageUrl
            openModal()
        }
        // -------------------------------------------------------------------------------------------------------------
        return {
            particleLife, captureOverlay, isCaptureOverlayOpen, modalActive,
            imageURL,
            closeModal, onChooseCaptureMode, onCaptureComplete
        }
    }
})
</script>

<style scoped>
#captureCanvas {
    background:  transparent;
}
</style>
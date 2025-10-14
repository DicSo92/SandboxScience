<template>
    <section absolute w-full h-full>
        <ClientOnly>
            <ParticleLifeCaptureOverlay ref="captureOverlay" v-if="isCaptureOverlayOpen"
                                        :getSelectedAreaImageData="getSelectedAreaImageData"
                                        :captureFPS="captureFPS" :captureDuration="captureDuration"
                                        @captureComplete="onCaptureComplete">>
            </ParticleLifeCaptureOverlay>
        </ClientOnly>

        <Modal :modalActive="modalActive" @close="closeModal">
            <div class="modal-content">
                <div flex items-center>
                    <span i-tabler-screenshot text-2xl mr-2></span>
                    <h1 text-xl>Choose Capture Mode</h1>
                </div>
                <hr mb-4>
                <section flex>
                    <div v-if="imageURL" class="w-2/3" relative bg-zinc-900 flex justify-center items-center rounded-lg p-1.5 border-2 border-gray-500 border-dashed>
                        <img :src="imageURL" alt="" w-full aspect-video object-scale-down object-center rounded>
                        <div absolute top-2 right-2>
                            <button type="button" title="Delete Capture" aria-label="Delete Capture" @click="imageURL = null"
                                    aspect-square rounded-full p-1 flex justify-center items-center
                                    class="bg-red-800 hover:bg-red-700">
                                <span i-tabler-trash text-lg></span>
                            </button>
                            <button type="button" title="Download" aria-label="Download" @click="downloadCapture"
                                    aspect-square rounded-full p-1 flex justify-center items-center mt-1
                                    class="bg-blue-950 hover:bg-blue-900">
                                <span i-tabler-download text-lg></span>
                            </button>
                        </div>
                    </div>
                    <div v-else flex items-center h-42 class="w-2/3">
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
                    <div class="w-1/3" pl-4>
                        <div rounded-xl bg-zinc-700 w-full px-3 py-2>
                            <h2 underline text-gray-300 mb-2>
                                GIF Options :
                            </h2>
                            <Input v-model="captureFPS" :debounce="0" mb-1>
                                <template #customLabel>
                                    <div text-sm flex-1>FPS</div>
                                </template>
                            </Input>
                            <Input v-model="captureDuration" :debounce="0">
                                <template #customLabel>
                                    <div text-sm flex-1>Time (s)</div>
                                </template>
                            </Input>
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

        const modalActive = ref<boolean>(false)
        const isCaptureOverlayOpen = ref<boolean>(false)

        const captureFPS = ref<number>(30)
        const captureDuration = ref<number>(3)

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
        function downloadCapture() {
            if (imageURL.value) {
                const a = document.createElement('a')
                a.href = imageURL.value
                a.download = `particle-life_${particleLife.captureType === 'screenshot' ? 'screenshot.png' : 'animation.gif'}`
                a.click()
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        return {
            particleLife, captureOverlay, isCaptureOverlayOpen, modalActive,
            imageURL, captureFPS, captureDuration,
            closeModal, onChooseCaptureMode, onCaptureComplete, downloadCapture
        }
    }
})
</script>

<style scoped>
#captureCanvas {
    background:  transparent;
}
</style>
<template>
    <section absolute h-full w-full>
        <ClientOnly>
            <ParticleLifeCaptureOverlay
                v-if="isCaptureOverlayOpen" ref="captureOverlay"
                :get-selected-area-image-data="getSelectedAreaImageData"
                :capture-f-p-s="captureFPS" :capture-duration="captureDuration"
                @capture-complete="onCaptureComplete"
            >
                >
            </ParticleLifeCaptureOverlay>
        </ClientOnly>

        <Modal :modal-active="modalActive" @close="closeModal">
            <div class="modal-content">
                <div flex items-center>
                    <span i-tabler-screenshot mr-2 text-2xl />
                    <h1 text-xl>
                        Choose Capture Mode
                    </h1>
                </div>
                <hr mb-4>
                <section flex>
                    <div v-if="imageURL" class="w-2/3" relative flex items-center justify-center border-2 border-gray-500 rounded-lg border-dashed bg-zinc-900 p-1.5>
                        <img :src="imageURL" alt="" aspect-video w-full rounded object-scale-down object-center>
                        <div absolute right-2 top-2>
                            <button
                                type="button" title="Delete Capture" aria-label="Delete Capture" aspect-square
                                flex items-center justify-center rounded-full p-1 class="bg-red-800 hover:bg-red-700"
                                @click="imageURL = null"
                            >
                                <span i-tabler-trash text-lg />
                            </button>
                            <button
                                type="button" title="Download" aria-label="Download" mt-1
                                aspect-square flex items-center justify-center rounded-full p-1 class="bg-blue-950 hover:bg-blue-900"
                                @click="downloadCapture"
                            >
                                <span i-tabler-download text-lg />
                            </button>
                        </div>
                    </div>
                    <div v-else h-42 flex items-center class="w-2/3">
                        <button
                            type="button" title="Screenshot" aria-label="Screenshot"
                            h-full flex flex-1 flex-col items-center justify-center border-2 border-gray-500 rounded-xl border-dashed px-4 py-1 text-gray-300
                            class="bg-zinc-800 hover:bg-zinc-700" @click="onChooseCaptureMode('screenshot')"
                        >
                            <span i-tabler-camera text-2xl />
                            Screenshot
                        </button>
                        <hr class="h-5/6" mx-3 border-l-1 border-gray-500 border-dashed py-8>
                        <button
                            type="button" title="GIF Capture" aria-label="GIF Capture"
                            h-full flex flex-1 flex-col items-center justify-center border-2 border-gray-500 rounded-xl border-dashed px-4 py-1 text-gray-300
                            class="bg-zinc-800 hover:bg-zinc-700" @click="onChooseCaptureMode('GIF')"
                        >
                            <span i-tabler-movie text-2xl />
                            GIF Capture
                        </button>
                    </div>
                    <div class="w-1/3" pl-4>
                        <div w-full rounded-xl bg-zinc-700 px-3 py-2>
                            <h2 mb-2 text-gray-300 underline>
                                GIF Options :
                            </h2>
                            <Input v-model="captureFPS" :debounce="0" mb-1>
                                <template #customLabel>
                                    <div flex-1 text-sm>
                                        FPS
                                    </div>
                                </template>
                            </Input>
                            <Input v-model="captureDuration" :debounce="0">
                                <template #customLabel>
                                    <div flex-1 text-sm>
                                        Time (s)
                                    </div>
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
            required: true,
        },
    },
    // eslint-disable-next-line unused-imports/no-unused-vars
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
            particleLife,
            captureOverlay,
            isCaptureOverlayOpen,
            modalActive,
            imageURL,
            captureFPS,
            captureDuration,
            closeModal,
            onChooseCaptureMode,
            onCaptureComplete,
            downloadCapture,
        }
    },
})
</script>

<style scoped>
#captureCanvas {
    background:  transparent;
}
</style>

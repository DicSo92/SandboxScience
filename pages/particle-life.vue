<template>
    <transition name="fade" @after-leave="onBootOverlayHidden">
        <div v-if="isBooting" class="fixed inset-0 z-50 bg-gray-950">
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="flex flex-col items-center gap-3">
                    <div class="h-10 w-10 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
                    <p class="text-white/80 text-sm">Loading simulation...</p>
                </div>
            </div>
        </div>
    </transition>
    <transition name="overlay-animation">
        <div v-if="isOverlayOpen" class="fixed inset-0 z-40 bg-gray-950/40 backdrop-blur-[0.6px]"></div>
    </transition>

    <Modal :modal-active="isModalOpen" @close="closeIntroModal" overlayColor="transparent">
        <section class="space-y-4">
            <header class="space-y-1">
                <h2 class="text-xl md:text-2xl font-semibold">Particle Life</h2>
                <p class="text-gray-300">
                    Particle Life is a particle simulator where simple interaction rules lead to complex, emergent behaviors.
                    Explore how tuning species interactions, forces, and initial conditions produces stable clusters, flowing patterns, and chaotic transitions in real time.
                </p>
            </header>

            <div v-if="isWebGPUSupported" class="rounded-lg border border-green-800 bg-green-900/20 p-3 text-green-100">
                <h3 class="font-medium mb-1">WebGPU is available</h3>

                <div v-if="currentRenderer === 'cpu'" class="space-y-2">
                    <p>
                        Great news! WebGPU is supported on this machine. Switch to the GPU renderer for up to 100x better performance.
                    </p>
                    <div class="flex items-center gap-3">
                        <button class="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 border border-emerald-700 text-white" @click.prevent="selectRenderer('gpu')">
                            Switch to WebGPU
                        </button>
                        <span class="text-xs text-emerald-200">Recommended</span>
                    </div>
                    <p class="text-xs text-green-200">
                        Prefer to stay on CPU?
                        <a href="#" class="underline hover:no-underline" @click.prevent="closeIntroModal">Keep CPU</a>.
                    </p>
                </div>

                <div v-else class="space-y-1">
                    <p>
                        You are using the GPU renderer. Enjoy the best performance (up to 100x faster than CPU).
                    </p>
                    <p class="text-sm">
                        Need compatibility or lower power usage?
                        <a href="#" class="underline hover:no-underline" @click.prevent="selectRenderer('cpu')">
                            Switch to CPU
                        </a>.
                    </p>
                </div>
            </div>

            <div v-else class="rounded-lg border border-yellow-700 bg-yellow-900/30 p-3 text-yellow-100">
                <h3 class="font-medium mb-1">WebGPU is not available</h3>
                <p>
                    GPU rendering cannot start on this device. You can still use the CPU renderer. To get up to 100x better performance, try enabling WebGPU:
                </p>
                <ul class="list-disc list-inside space-y-1 mt-2 text-yellow-50">
                    <li>Windows: Settings → System → Display → Graphics → Graphics settings, add Chrome/Edge and select High performance GPU.</li>
                    <li>Update Chrome or Edge to version 113+ and enable Hardware Acceleration in browser settings.</li>
                    <li>Update your GPU drivers (NVIDIA/AMD/Intel).</li>
                    <li>Check chrome://gpu or edge://gpu and ensure WebGPU is Hardware accelerated.</li>
                    <li>Temporarily disable extensions that may affect rendering and restart the browser.</li>
                    <li>Use a secure context: HTTPS or localhost.</li>
                </ul>
            </div>

            <!-- Performance warning even when WebGPU is available -->
            <div v-if="isWebGPUSupported && currentRenderer === 'gpu'" class="mt-3 rounded-lg border border-yellow-700 bg-yellow-900/30 p-3 text-yellow-100">
                <strong class="font-medium">Performance warning</strong>
                <p class="mt-1 text-sm">
                    If performance is not as expected, your system may be using the integrated GPU or a wrong graphics profile.
                </p>
                <p class="mt-1 text-sm">
                    On Windows, go to Settings → System → Display → Graphics → Graphics settings, add Chrome/Edge and select High performance GPU.
                    <br>
                    Also enable Hardware Acceleration in your browser settings and restart the browser.
                </p>
                <p class="mt-2 text-xs opacity-90">
                    Tip: Check `chrome://gpu` or `edge://gpu` and confirm WebGPU is “Hardware accelerated”.
                </p>
            </div>

            <div flex justify-end>
                <ToggleSwitch label="Don’t show this again" colorful-label v-model="modalDismissed" @update:modelValue="toggleModalDismiss" />
            </div>
        </section>
    </Modal>

    <component v-if="particleLifeComponent" :is="particleLifeComponent" :key="currentRenderer" />
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    components: {},
    setup() {
        definePageMeta({
            layout: 'life',
            hideNavBar: true
        })
        useSeoMeta({
            title: 'Particle Life',
            description: 'Discover Particle Life, an interactive and educational particle simulator to understand physical phenomena and particle system dynamics.',
            ogTitle: 'Particle Life • Particle Simulation',
            ogDescription: 'Discover Particle Life, an interactive and educational particle simulator to understand physical phenomena and particle system dynamics.',
            twitterTitle: 'Particle Life • Particle Simulation',
            twitterDescription: 'Discover Particle Life, an interactive and educational particle simulator to understand physical phenomena and particle system dynamics.',
        })

        const isModalOpen = ref<boolean>(false)
        const isOverlayOpen = ref<boolean>(true)
        const isWebGPUSupported = ref<boolean>(true)
        const currentRenderer = ref<'gpu' | 'cpu'>('cpu') // track active renderer
        const particleLifeComponent = shallowRef<Component | null>(null)
        const MODAL_DISMISS_KEY = 'particle-life:intro-modal-dismissed' // key stored in localStorage
        const modalDismissed = ref<boolean>(false)

        const isBooting = ref<boolean>(true)
        const onBootOverlayHidden = () => {
            isModalOpen.value = !modalDismissed.value
            isOverlayOpen.value = !modalDismissed.value
        }
        const closeIntroModal = () => {
            isModalOpen.value = false
            isOverlayOpen.value = false
        }

        onMounted(async () => {
            modalDismissed.value = localStorage.getItem(MODAL_DISMISS_KEY) === 'true'
            isOverlayOpen.value = !modalDismissed.value

            isWebGPUSupported.value = await checkGPUAdapter()
            // isWebGPUSupported.value = false // TEMP DISABLE GPU RENDERER
            await selectRenderer(isWebGPUSupported.value ? 'gpu' : 'cpu')

            await new Promise(resolve => setTimeout(resolve, 200))
            isBooting.value = false
        })
        // -------------------------------------------------------------------------------------------------------------
        const checkGPUAdapter = async () => {
            const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
            if (!adapter) {
                console.error("WebGPU adapter not found")
                return false
            }
            const device = await adapter.requestDevice().catch(() => null)
            if (!device) {
                console.error("WebGPU device not found")
                return false
            }

            console.log("WebGPU is supported")
            return true
        }
        const selectRenderer = async (mode: 'gpu' | 'cpu', closeModal: boolean = false) => {
            isBooting.value = true
            await new Promise(resolve => setTimeout(resolve, 300)) // allow overlay to show
            if (mode === 'gpu') {
                particleLifeComponent.value = (await import('~/components/particle-life/ParticleLifeGpu.vue')).default
            } else {
                particleLifeComponent.value = (await import('~/components/particle-life/ParticleLifeCpu.vue')).default
            }
            currentRenderer.value = mode
            await new Promise(resolve => setTimeout(resolve, 200)) // allow component to mount
            isBooting.value = false
            if (closeModal) isModalOpen.value = false
        }
        const toggleModalDismiss = () => {
            if (modalDismissed.value) {
                localStorage.setItem(MODAL_DISMISS_KEY, 'true')
            } else {
                localStorage.removeItem(MODAL_DISMISS_KEY)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        onUnmounted(() => {
            console.log('Particle Life Unmounted')
        })

        return {
            isModalOpen, isWebGPUSupported, particleLifeComponent, selectRenderer, currentRenderer,
            modalDismissed, toggleModalDismiss,
            isBooting, onBootOverlayHidden, isOverlayOpen, closeIntroModal
        }
    }
})
</script>

<style lang="scss" scoped>
.overlay-animation-enter-active,
.overlay-animation-leave-active {
    transition: opacity 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}
.overlay-animation-enter-from,
.overlay-animation-leave-to {
    opacity: 0;
}
.fade-enter-active, .fade-leave-active {
    transition: opacity 600ms ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>

<template>
    <div flex-1 flex flex-col items-center>
        <section container my-32>
            <div flex px-0 class="xl:px-16 2xl:px-24">
                <div mr-2>
                    <h1 text-8xl font-bold>🧪</h1>
                </div>
                <div>
                    <h1 text-5xl font-bold text="#2A9D8F">
                        Sandbox Science
                    </h1>
                    <h3 text-2xl font-bold mt-3>Unlock the mysteries of science through immersive and interactive simulations.</h3>
                    <p mt-4>
                        Explore Game of Life, ParticleLife, and other captivating scientific simulations. Dive into hands-on
                        learning and discover complex concepts with interactive visual experiences.
                    </p>
                </div>
            </div>

        </section>
        <section container>
            <div grid grid-cols-3 gap-4>
                <NuxtLink to="/game-of-life" bg="gray-800 hover:gray-700" p-4 rounded-lg>
                    <div flex items-center mb-1>
                        <span text-3xl font-bold mr-1>🧬</span>
                        <h3 text-xl>Game Of Life</h3>
                    </div>
                    <p>Explore the intriguing patterns and behaviors of cellular automata in this classic simulation by John Conway.</p>
                </NuxtLink>
                <NuxtLink to="/particle-life" bg="gray-800 hover:gray-700" p-4 rounded-lg>
                    <div flex items-center mb-1>
                        <span text-3xl font-bold mr-2>⚛</span>
                        <h3 text-xl>ParticleLife</h3>
                    </div>
                    <p>Observe the fascinating interactions and emergent behaviors of particles in a dynamic and interactive environment.</p>
                </NuxtLink>
                <NuxtLink to="/hash-life" bg="gray-800 hover:gray-700" p-4 rounded-lg>
                    <div flex items-center mb-1>
                        <span text-3xl font-bold mr-2>🚀</span>
                        <h3 text-xl>HashLife</h3>
                    </div>
                    <p>Experience the optimized version of the Game of Life, enabling faster and more efficient simulation of complex patterns.</p>
                </NuxtLink>
            </div>
        </section>
        <section mt-24>
            <div w-full flex>
                <button type="button" btn rounded-full p2 flex items-center>
                    <span i-carbon-logo-discord text-5xl></span>
                </button>
                <button type="button" btn rounded-full p2 flex items-center>
                    <span i-carbon-logo-github text-5xl></span>
                </button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'life'
})
const route = useRoute()
</script>

<style scoped lang="scss">

</style>

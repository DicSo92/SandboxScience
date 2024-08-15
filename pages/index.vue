<template>
    <div flex-1 flex flex-col items-center>
        <section container mt-36 mb-32>
            <div flex px-0 class="xl:px-16 2xl:px-24 flex-col sm:flex-row">
                <div class="mr-0 sm:mr-4 md:mr-6 mb-4 sm-mb-0 flex justify-center items-start md-items-center">
                    <div class="i-custom:icon text-8xl sm:text-9xl md:text-[9.5rem]"></div>
                </div>
                <div class="text-center sm:text-start">
                    <h1 text-5xl font-bold text="#2A9D8F">
                        Sandbox Science
                    </h1>
                    <h2 text-2xl font-bold mt-3>Unlock the mysteries of science through immersive and interactive simulations.</h2>
                    <p mt-4>
                        Explore Game of Life, Particle Life, and other captivating scientific simulations. Dive into hands-on
                        learning and discover complex concepts with interactive visual experiences.
                    </p>
                </div>
            </div>
        </section>
        <section container>
            <div grid gap-4 grid-cols-1 class="sm:grid-cols-3">
                <SiteLink to="/game-of-life" bg="gray-900 hover:gray-800" p-4 rounded-lg>
                    <div flex items-center mb-1>
                        <span text-3xl font-bold mr-1>🧬</span>
                        <h3 text-xl>Game Of Life</h3>
                    </div>
                    <p>Explore the intriguing patterns and behaviors of cellular automata in this classic simulation by John Conway.</p>
                </SiteLink>
                <SiteLink to="/particle-life" bg="gray-900 hover:gray-800" p-4 rounded-lg>
                    <div flex items-center mb-1>
                        <span text-3xl font-bold mr-2>⚛</span>
                        <h3 text-xl>Particle Life</h3>
                    </div>
                    <p>Observe the fascinating interactions and emergent behaviors of particles in a dynamic and interactive environment.</p>
                </SiteLink>
                <SiteLink to="/hash-life" bg="gray-900 hover:gray-800" p-4 rounded-lg>
                    <div flex items-center mb-1>
                        <span text-3xl font-bold mr-2>🚀</span>
                        <h3 text-xl>Hash Life</h3>
                    </div>
                    <p>Experience the optimized version of the Game of Life, enabling faster and more efficient simulation of complex patterns.</p>
                </SiteLink>
            </div>
        </section>
        <section my-12 flex-1 flex flex-col justify-end>
            <div w-full flex>
                <NuxtLink to="https://discord.com/invite/z5yuzkFpCA" target="_blank" flex items-center py-0 mx-2>
                    <button type="button" name="Discord" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-discord text-5xl></span>
                    </button>
                </NuxtLink>
                <NuxtLink to="https://github.com/DicSo92/SandboxScience" target="_blank" flex items-center py-0 mx-2>
                    <button type="button" name="Github" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-github text-5xl></span>
                    </button>
                </NuxtLink>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'life'
})
</script>

<style scoped lang="scss">

</style>

<template>
    <div flex-1 flex flex-col items-center>
        <section container class="mt-24 sm:mt-36 mb-16 sm:mb-32">
            <div flex class="px-0 xl:px-16 2xl:px-24 flex-col sm:flex-row">
                <div class="mr-0 sm:mr-4 md:mr-6 mb-4 sm-mb-0 flex justify-center items-start md-items-center">
                    <div class="i-custom:icon text-7xl sm:text-9xl md:text-[9.5rem]"></div>
                </div>
                <div class="text-center sm:text-start">
                    <h1 class="text-4xl sm:text-5xl" font-bold text="#2A9D8F">
                        Sandbox Science
                    </h1>
                    <h2 class="text-lg sm:text-2xl" font-bold mt-3>Unlock the mysteries of science through immersive and interactive simulations.</h2>
                    <p mt-4 class="text-sm sm:text-base">
                        Explore Game of Life, Particle Life, and other captivating scientific simulations. Dive into hands-on
                        learning and discover complex concepts with interactive visual experiences.
                    </p>
                </div>
            </div>
        </section>
        <section container>
            <div grid gap-4 grid-cols-1 class="sm:grid-cols-3">
                <SiteLink to="/particle-life" bg="gray-900 hover:gray-800"
                          class="relative overflow-hidden rounded-lg border border-gray-800 shadow-lg p-6 sm:p-5 md:p-6 pt-3 sm:pt-4 md:pt-4">
                    <div flex items-center mb-2>
                        <span class="text-2xl md:text-3xl" font-bold mr-2>⚛</span>
                        <h3 class="text-lg md:text-xl font-semibold">Particle Life</h3>
                    </div>
                    <p class="text-sm md:text-base">Observe the fascinating interactions and emergent behaviors of particles in a dynamic and interactive environment.</p>
                    <div class="absolute right-0 top-0 h-16 w-16">
                        <div class="shadow-lg absolute transform rotate-45 bg-[#00b84d] bg-opacity-70 text-center text-sm text-white font-semibold py-1 right-[-38px] top-[13px] w-[128px]">
                            BETA
                        </div>
                    </div>
                </SiteLink>
                <SiteLink to="/game-of-life" bg="gray-900 hover:gray-800"
                          class="relative overflow-hidden rounded-lg border border-gray-800 shadow-lg p-6 sm:p-5 md:p-6 pt-3 sm:pt-4 md:pt-4">
                    <div flex items-center mb-2>
                        <span class="text-2xl md:text-3xl" font-bold mr-1>🧬</span>
                        <h3 class="text-lg md:text-xl font-semibold">Game Of Life</h3>
                    </div>
                    <p class="text-sm md:text-base">Explore the intriguing patterns and behaviors of cellular automata in this classic simulation by John Conway.</p>
                    <div class="absolute right-0 top-0 h-16 w-16">
                        <div class="shadow-lg absolute transform rotate-45 bg-[#e76f51] bg-opacity-70 text-center text-sm text-white font-semibold py-1 right-[-38px] top-[13px] w-[128px]">
                            ALPHA
                        </div>
                    </div>
                </SiteLink>
                <SiteLink to="/hash-life" bg="gray-900 hover:gray-800"
                          class="relative overflow-hidden rounded-lg border border-gray-800 shadow-lg p-6 sm:p-5 md:p-6 pt-3 sm:pt-4 md:pt-4">
                    <div flex items-center mb-2>
                        <span class="text-2xl md:text-3xl" font-bold mr-2>🚀</span>
                        <h3 class="text-lg md:text-xl font-semibold">Hash Life</h3>
                    </div>
                    <p class="text-sm md:text-base">Experience the optimized version of the Game of Life, enabling faster and more efficient simulation of complex patterns.</p>
                    <div class="absolute right-0 top-0 h-16 w-16">
                        <div class="shadow-lg absolute transform rotate-45 bg-[#5b2e48] bg-opacity-70 text-center text-sm text-white font-semibold py-1 right-[-38px] top-[13px] w-[128px]">
                            WIP
                        </div>
                    </div>
                </SiteLink>
            </div>
        </section>
        <section my-12 flex-1 flex flex-col justify-end>
            <div w-full flex>
                <NuxtLink to="https://discord.com/invite/z5yuzkFpCA" title="Discord" aria-label="Discord" target="_blank" flex items-center py-0 mx-2>
                    <button type="button" name="Discord" aria-label="Discord" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-discord text-5xl></span>
                    </button>
                </NuxtLink>
                <NuxtLink to="https://github.com/DicSo92/SandboxScience" title="Github" aria-label="Github" target="_blank" flex items-center py-0 mx-2>
                    <button type="button" name="Github" aria-label="Github" text="zinc-3 hover:zinc-1" flex>
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

<template>
    <div flex flex-1 flex-col items-center>
        <section container class="mb-24 mt-24 sm:mt-36">
            <div flex class="flex-col px-0 sm:flex-row 2xl:px-24 xl:px-16">
                <div class="mb-4 mr-0 flex justify-center sm:mb-0 sm:mr-2">
                    <div text-5xl font-bold>
                        🧐
                    </div>
                </div>
                <div class="text-center sm:text-start">
                    <h1 text-5xl font-bold text="#2A9D8F">
                        About
                    </h1>
                    <h2 mt-3 text-2xl font-bold>
                        🚧 Site currently in development 🚧
                    </h2>
                    <p mt-5>
                        Welcome to Sandbox Science, an interactive platform designed to make learning and exploring scientific
                        concepts fun and accessible. Our site offers a variety of simulations, from cellular automata like
                        Game of Life to complex particle interactions in Particle Life, allowing users to dive deep into the
                        fascinating world of science through hands-on, visual experiences.
                    </p>
                    <p mt-4>
                        Please note that Sandbox Science is currently in beta. As we continue to develop and refine the
                        platform, you may encounter pages that are incomplete or features that are not yet fully functional.
                        We appreciate your understanding and encourage you to provide feedback to help us improve the site.
                    </p>
                    <p mt-4>
                        Sandbox Science is open-source and licensed under the
                        <NuxtLink to="https://github.com/DicSo92/SandboxScience/blob/master/LICENSE" target="_blank" class="text-#2A9D8F hover:underline">
                            GNU Affero General Public License v3.0 (AGPL-3.0)
                        </NuxtLink>.
                        We invite everyone to contribute to its development. Whether you're a developer, a designer, or simply passionate about
                        science, you can join us in shaping the future of this project.
                    </p>
                    <p mt-4>
                        You can join our community on Discord to share your feedback, discuss ideas,
                        and connect with other science enthusiasts. We look forward to hearing from you and working together.
                    </p>
                </div>
            </div>
        </section>
        <section mb-12 flex flex-1 flex-col justify-end>
            <div w-full flex>
                <NuxtLink to="https://discord.com/invite/z5yuzkFpCA" title="Discord" aria-label="Discord" target="_blank" mx-2 flex items-center py-0>
                    <button type="button" name="Discord" aria-label="Discord" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-discord text-5xl />
                    </button>
                </NuxtLink>
                <NuxtLink to="https://github.com/DicSo92/SandboxScience" title="Github" aria-label="Github" target="_blank" mx-2 flex items-center py-0>
                    <button type="button" name="Github" aria-label="Github" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-github text-5xl />
                    </button>
                </NuxtLink>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'life',
})
useSeoMeta({
    title: 'About',
    ogTitle: 'About',
    twitterTitle: 'About',
    description: 'Explore Sandbox Science, an interactive platform that makes learning scientific concepts engaging and fun through simulations. Join our Discord community to connect with science enthusiasts, share feedback, and contribute to the project.',
    ogDescription: 'Explore Sandbox Science, an interactive platform that makes learning scientific concepts engaging and fun through simulations. Join our Discord community to connect with science enthusiasts, share feedback, and contribute to the project.',
    twitterDescription: 'Explore Sandbox Science, an interactive platform that makes learning scientific concepts engaging and fun through simulations. Join our Discord community to connect with science enthusiasts, share feedback, and contribute to the project.',
})
</script>

<style scoped lang="scss">

</style>

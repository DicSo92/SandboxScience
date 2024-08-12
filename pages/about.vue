<template>
    <div flex-1 flex flex-col items-center>
        <section container class="mb-24 mt-24 sm:mt-36">
            <div flex class="px-0 xl:px-16 2xl:px-24 flex-col sm:flex-row">
                <div class="mr-0 sm:mr-2 mb-4 sm:mb-0 flex justify-center">
                    <div text-5xl font-bold>🧐</div>
                </div>
                <div class="text-center sm:text-start">
                    <h1 text-5xl font-bold text="#2A9D8F">
                        About
                    </h1>
                    <h2 text-2xl font-bold mt-3>🚧 Site currently in development 🚧</h2>
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
                        We are excited to announce that Sandbox Science will soon become open-source, inviting everyone to
                        contribute to its development. Whether you’re a developer, a designer, or simply passionate about
                        science, you’ll be able to join us in shaping the future of this project.
                    </p>
                    <p mt-4>
                        In the meantime, you can join our community on Discord to share your feedback, discuss ideas,
                        and connect with other science enthusiasts. We look forward to hearing from you and working together.
                    </p>
                </div>
            </div>
        </section>
        <section mb-12 flex-1 flex flex-col justify-end>
            <div w-full flex>
                <button type="button" name="discord" btn rounded-full p2 flex items-center>
                    <span i-carbon-logo-discord text-5xl></span>
                </button>
                <button type="button" name="github" btn rounded-full p2 flex items-center>
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
</script>

<style scoped lang="scss">

</style>

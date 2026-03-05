import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// Vercel specific options
			runtime: 'nodejs20.x',
		}),
		// Handle trailing slashes for SEO
		trailingSlash: 'never'
	}
};

export default config;

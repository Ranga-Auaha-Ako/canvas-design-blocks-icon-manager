import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		preprocess({
			defaults: {
				style: 'postcss'
			},
			postcss: true
		})
	],

	kit: {
		adapter: adapter()
		// prerender: {
		// 	// This can be false if you're using a fallback (i.e. SPA mode)
		// 	default: true,
		// 	entries: ['*', '/meta.json']
		// },
		// paths: {
		// 	base: '/editor'
		// }
	}
};

export default config;

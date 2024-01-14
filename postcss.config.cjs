const tailwindcss = require('tailwindcss');
const nesting = require('@tailwindcss/nesting');
const autoprefixer = require('autoprefixer');
const PostCSSImport = require('postcss-import');

const config = {
	syntax: 'postcss-scss',
	plugins: [
		//Some plugins, like tailwindcss/nesting, need to run before Tailwind,
		PostCSSImport(),
		nesting(),
		tailwindcss(),
		autoprefixer()
		//But others, like autoprefixer, need to run after
	]
};

module.exports = config;

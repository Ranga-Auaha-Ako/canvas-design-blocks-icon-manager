import { json as json$1 } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Category, Icon } from '$lib/icons';
import glob from 'glob';
import path from 'path';
import fs from 'fs'
// import icons from '../../../dist/meta.json';
import beautify from "json-beautify";
import fg from 'fast-glob'
import 'dotenv/config'

const dirname = process.env.ICONS_DIR;

if(!dirname) {
	throw new Error("ICONS_DIR env variable is not set! Please do that.");
	
}

export const prerender = true;


/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
 export async function GET() {
	// Attempt to import meta files
	const metaFiles = (await fg('**/meta.json', { onlyFiles: false, deep: 2, cwd: dirname })).sort();
	
	const icons = metaFiles.map( catFile => {
		const catData = JSON.parse(fs.readFileSync(path.join(dirname, catFile), 'utf8'));
		const catName = path.basename(path.dirname(catFile));
		const CatIcons = catData.icons.map((icon: Icon) => {
			return {...icon, url: path.join(catName,icon.url)};
		})
		return {icons: CatIcons, name: catName}
	})
	
	// Get the real folder structure for the icons
	const categories = glob.sync(path.join(dirname, '*/'));
	const iconsByCategory = categories.map((foundPath) => {
		const category = path.basename(foundPath);
		const icons = glob.sync(`${category}/*.svg`, { cwd: dirname });
		return { category, icons };
	});

	if (icons) {
		return json$1({
			meta: icons,
			files: iconsByCategory
		});
	}

	return new Response(undefined, { status: 404 });
}

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function PUT({request}: RequestEvent) {
	// origin = request.headers.get("Origin");
	const categories = await request.json() as Category[];
	if(!categories || !categories[0].name || !Object.hasOwn(categories[0],"icons")) {return new Response(undefined, { status: 400 })};

	categories.forEach(category => {
		// Generate Path
		const categoryPath = path.join(dirname, category.name, './meta.json');

		// Strip icon URLs of the category
		category.icons = category.icons.map(icon => {
			icon.url = icon.url.replace(`${category.name}/`, "");
			return icon;
		})
		// Save the files
		// https://github.com/gre/json-beautify/issues/6
		const replacer : any = null;
		fs.writeFileSync(categoryPath, beautify({icons: category.icons}, replacer, "\t", 100), 'utf8');
	})
	return json$1({ message: "Successfully saved" })
}
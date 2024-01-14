import fs from 'fs';
import 'dotenv/config'

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }: any) {
	const { category, name } = params;
	const dirname = process.env.ICONS_DIR;
	return new Response(fs.readFileSync(`${dirname}/${category}/${name}.svg`, 'utf8'), {
		headers: { 'content-type': 'image/svg+xml' }
	});
}

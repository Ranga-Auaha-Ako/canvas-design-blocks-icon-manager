import type { Icon, Category, foundCategory, iconMeta, RichFile, RichIcon } from '$lib/icons';
import { base } from '$app/paths';
import { nanoid } from 'nanoid';

export default async (f: RichFile, $nounProjectAuth: { key: string; secret: string }) => {
	let tnp_id = '';
	const foundID = f.name.match(/noun[_-][\w\d_-]+[_-](\d+)/);
	if (foundID && foundID[1]) {
		tnp_id = foundID[1];
	}

	const icon: RichIcon = {
		id: nanoid(),
		ligature: f.name.replace(/\.svg$/, ''),
		name: f.name.replace(/\.svg$/, ''),
		url: f.name,
		width: 48,
		height: 48,
		tnp_id,
		tags: [],
		term: '',
		collections: [],
		file: f
	};
	const iconData = await fetch(`${base}/nounfetch.json`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			key: $nounProjectAuth.key,
			secret: $nounProjectAuth.secret,
			id: icon.tnp_id
		})
	}).then((res) => res.json());
	if (iconData.error) {
		console.error(
			'Error encountered whilst fetching TNP icon! Likely this is due to the API Keys being wrong or an incorrect TNP ID.'
		);
		return icon;
	}
	// Update icon data if it doesn't already exist, merge in new terms
	if (!icon.title) icon.title = iconData.icon.term;
	if (!icon.term) icon.term = iconData.icon.term;
	// -- Tags
	const newTags = iconData.icon.tags.map((t: any) => t.slug);
	icon.tags = icon.tags ? [...new Set(icon.tags.concat(newTags))] : newTags;
	// -- Collections
	const newCollections = iconData.icon.collections.map((t: any) => t.name);
	icon.collections = icon.collections
		? [...new Set(icon.collections.concat(newCollections))]
		: newCollections;
	return icon;
};

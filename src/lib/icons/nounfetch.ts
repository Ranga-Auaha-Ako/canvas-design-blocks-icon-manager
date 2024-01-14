import type { Icon, Category, foundCategory, iconMeta } from '$lib/icons';
import { base } from '$app/paths';

export default async (icon: Icon, $nounProjectAuth: {key: string, secret: string}) => {
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

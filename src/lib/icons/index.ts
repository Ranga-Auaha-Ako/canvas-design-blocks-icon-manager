import { dev } from '$app/env';
import { base } from '$app/paths';

export interface Icon {
    id: string;
    url: string;
    title?: string;
    width: number;
    height: number;
    tnp_id: string;
    tags?: string[];
    term?: string;
    collections?: string[];
}

export interface Category {
    name: string;
    icons: Icon[];
}

export interface foundCategory {
    category: string;
    icons: string[];
}

export interface iconMeta {
    meta: Category[];
    files: foundCategory[];
}

export const getIconClass = (url: string): string => {
	// eg : svg-Aotearoa--noun_Beehive_147848
	// Strip svg from end
	url = url.replace(/\.svg$/, '');
	url = url.replace(/\s/g, '-');
	// Split into folders
	const parts = url.split('/');
	return `${parts.join('--')}`;
};

export const getIconUrl = (icon: Icon) : string => {
    return `${base}/icon/${icon.url}`;
}
import { dev } from '$app/environment';
import { base } from '$app/paths';
import { diff } from 'deep-object-diff';
import { Buffer } from 'buffer/';
import beautify from 'json-beautify';

export interface Icon {
	id: string;
	ligature?: string;
	name?: string;
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
	visible?: boolean;
	icons: Icon[];
}

export class RichCategory implements Category {
	private _originalIcons: RichIcon[] = [];
	public removed: RichIcon[] = [];
	public added: RichIcon[] = [];
	name: string;
	visible: boolean | undefined;
	newIcons: RichFile[];
	icons: RichIcon[];
	constructor(
		public metaFileHandler: FileSystemFileHandle,
		public folderHandler: FileSystemDirectoryHandle,
		meta: {
			name: string;
			visible?: boolean;
			icons: RichIcon[];
			newIcons: RichFile[];
		}
	) {
		this._originalIcons = meta.icons;
		this.icons = meta.icons.map((icon) => ({ ...icon }));
		this.name = meta.name;
		this.visible = meta.visible;
		this.newIcons = meta.newIcons;
	}
	isRemoved = (icon: RichIcon) => {
		return this.removed.includes(icon);
	};
	/**
	 * Icons that have had their metadata modified since save.
	 */
	get changed(): RichIcon[] {
		return this._originalIcons.filter((icon) => {
			const found = this.icons.find((i) => i.file === icon.file);
			if (!found) return false;
			const diffObj = diff(icon, found);
			return Object.keys(diffObj).length > 0;
		});
	}

	removeIcon(icon: RichIcon | string) {
		let ic: RichIcon = icon as RichIcon;
		if (typeof icon === 'string') {
			const foundIc = this._originalIcons.find((i) => i.id === icon);
			if (!foundIc) return;
			ic = foundIc;
		}
		this.removed.push(ic);
	}
	addIcon(icon: RichIcon) {
		this.added.push(icon);
	}
	async save() {
		const newFile = {
			name: this.name,
			visible: this.visible,
			icons: this.icons.map((icon) => {
				const { file, ...iconData } = icon;
				return iconData;
			})
		};
		if (dev) {
			console.log('Saving category', this.name);
			console.log('Removed icons', this.removed);
			console.log('Added icons', this.added);
			console.log('Changed icons', this.changed);
			console.log('New file', newFile);
		}
		const writable = await this.metaFileHandler.createWritable();
		writable.truncate(0);
		const replacer: any = null;
		await writable.write(beautify(newFile, replacer, '\t', 100));
		await writable.close();
		this._originalIcons = this.icons;
		this.removed = [];
		this.added = [];
	}
}

export type RichIcon = Icon & { file: RichFile };

export type RichFile = File & {
	relativePath: string;
	handler: FileSystemFileHandle;
	parent?: FileSystemDirectoryHandle;
};

export interface foundCategory {
	category: string;
	folder: FileSystemDirectoryHandle;
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

export const getIconUrl = async (icon: RichIcon): Promise<string> => {
	const file = icon.file;
	if (!file) return '';
	const b64 = Buffer.from(await file.arrayBuffer()).toString('base64');
	return `data:image/svg+xml;base64,${b64}`;
};

// New version of icon management which uses the File System API to read the icon files from the file system. This means we can deploy this as a web app and it will still work.

import {
	type Category,
	type Icon,
	type RichFile,
	RichCategory,
	type RichIcon,
	type foundCategory
} from '.';
// Adapted from:
// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle#return_handles_for_all_files_in_a_directory
export async function* getFilesRecursively(
	entry: FileSystemHandleUnion,
	path = '',
	parent?: FileSystemDirectoryHandle
): AsyncGenerator<RichFile> {
	if (entry.kind === 'file') {
		const file: File = await entry.getFile();
		if (file !== null) {
			const richFile = file as any;
			richFile.parent = parent;
			richFile.relativePath = path + file.name;
			richFile.handler = entry;
			yield richFile;
		}
	} else if (entry.kind === 'directory') {
		for await (const handle of entry.values()) {
			yield* getFilesRecursively(handle, path + entry.name + '/', entry);
		}
	}
}
export class IconFilesystem {
	static getFilesystem = async () => {
		const fileHandle = await window.showDirectoryPicker();
		if (!fileHandle) {
			throw new Error('No file handle');
		}
		const opts = { mode: 'readwrite' as const };
		// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle#queryrequest_permissions
		if ((await fileHandle.queryPermission(opts)) === 'granted') {
			return new IconFilesystem(fileHandle);
		}
		// Request permission to the file, if the user grants permission
		if ((await fileHandle.requestPermission(opts)) === 'granted') {
			return new IconFilesystem(fileHandle);
		}
		// The user did not grant permission
		throw new Error('No permission');
	};
	public files;
	public categories;
	public folders: Promise<FileSystemDirectoryHandle[]>;
	public foundCategories: foundCategory[] = [];
	constructor(public folderHandle: FileSystemDirectoryHandle) {
		// Get the list of files
		this.files = getFilesRecursively(this.folderHandle);
		this.folders = new Promise(async (resolve, reject) => {
			const folders: FileSystemDirectoryHandle[] = [];
			for await (const path of this.folderHandle.values()) {
				if (path.kind !== 'directory') continue;
				folders.push(path);
			}
			resolve(folders);
		});
		this.categories = new Promise<RichCategory[]>(async (resolve, reject) => {
			const categories: RichCategory[] = [];
			let allFiles: RichFile[] = [];
			for await (const file of this.files) {
				allFiles.push(file);
			}
			for (const file of allFiles) {
				if (file.name !== 'meta.json') continue;
				const json = await file.text();
				const meta = JSON.parse(json) as Category;
				// Enrich the category with the file for each icon
				const currentFolder = file.relativePath.replace(/meta\.json$/, '');
				const icons = meta.icons.reduce((acc, icon) => {
					const foundFile = allFiles.find(
						(file) => file.relativePath === `${currentFolder}${icon.url}`
					);
					if (!foundFile) {
						console.error(`No file found for ${icon.url}`);
						return acc;
					}
					const enrichedIcon = {
						...icon,
						file: foundFile
					};
					acc.push(enrichedIcon);
					return acc;
				}, [] as RichIcon[]);
				if (!file.parent) continue;
				if (!meta.name) meta.name = file.parent.name;
				const cat = new RichCategory(file.handler, file.parent, {
					...meta,
					icons,
					newIcons: []
				});
				categories.push(cat);
			}
			// Loop over again to find new icons
			for (const file of allFiles) {
				if (!file.name.endsWith('.svg')) continue;
				if (!file.parent) continue;
				// Find the category
				const category = categories.find((cat) => cat.folderHandler === file.parent);
				if (!category) {
					// See if we already found this category
					const foundCategory = this.foundCategories.find((cat) => cat.folder === file.parent);
					if (foundCategory) {
						foundCategory.icons.push(file.name);
						continue;
					} else {
						this.foundCategories.push({
							category: file.parent.name,
							folder: file.parent,
							icons: [file.name]
						});
						continue;
					}
				}
				// Check if icon already exists
				const foundIcon = category.icons.find((icon) => (icon as RichIcon)?.file === file);
				if (foundIcon) {
					continue;
				}
				// Add the icon to the category
				category.newIcons.push(file);
			}
			resolve(categories);
		});
	}
	save = async () => {
		const categories = await this.categories;
		for (const cat of categories) {
			await cat.save();
		}
	};
}

<script async lang="ts">
	import { onMount } from 'svelte';
	import { expoInOut } from 'svelte/easing';
	import { slide, fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { base, assets } from '$app/paths';
	import { nanoid } from 'nanoid';

	import {
		type Icon,
		type Category,
		type foundCategory,
		type iconMeta,
		RichCategory,
		type RichIcon,
		type RichFile
	} from '$lib/icons';
	import { getIconUrl } from '$lib/icons';
	import nounFetch from '$lib/icons/nounfetch';
	import IconList from '$lib/icons/iconList.svelte';
	import IconForm from '$lib/icons/iconForm.svelte';
	import { chosenCategory, chosenIcon, nounProjectAuth } from '../store';
	import { IconFilesystem, getFilesRecursively } from '$lib/icons/filesystem';

	// Custom slide transition
	function expandPanel(node: Element, { delay = 0, duration = 200, easing = expoInOut }) {
		const w = parseFloat(getComputedStyle(node).width);

		return {
			delay,
			duration,
			easing: easing || expoInOut,
			css: (t: number) => `margin-right: ${(1 - t) * w * -1}px; position: relative; width: ${w}px;`
		};
	}

	let fs: IconFilesystem;
	let iconData: RichCategory[] = [];
	let newCategories: foundCategory[] = [];
	let loading = true;

	$: chosenIconData = iconData
		? iconData[$chosenCategory]?.icons.find((i) => i.id == $chosenIcon)
		: undefined;
	$: iconNotDeleted = !iconData[$chosenCategory]?.removed.find((i) => i.id == chosenIconData?.id);

	const updateIcons = (e: CustomEvent) => {
		const { icons } = e.detail;
	};

	let existingTags = [] as string[];
	let existingCollections = [] as string[];
	const updateTagData = () => {
		if (!iconData) return;
		existingTags = [
			// Only unique values
			...new Set(
				iconData.reduce(
					(acc, cat) =>
						// Step through categories, reducing each icon to a list of tags and bunching together
						acc.concat(
							cat.icons.reduce((acc, i) => (i.tags ? acc.concat(i.tags) : acc), [] as string[])
						),
					[] as string[]
				)
			)
		];
		// Load list of collections
		existingCollections = [
			// Only unique values
			...new Set(
				iconData.reduce(
					(acc, cat) =>
						// Step through categories, reducing each icon to a list of tags and bunching together
						acc.concat(
							cat.icons.reduce(
								(acc, i) => (i.collections ? acc.concat(i.collections) : acc),
								[] as string[]
							)
						),
					[] as string[]
				)
			)
		];
	};

	const addIcon = (e: CustomEvent<RichIcon>) => {
		console.log(e.detail);
		console.log($chosenCategory);
		if (!iconData) return;
		console.log(iconData[$chosenCategory]);
		const icon = e.detail;
		$chosenIcon = icon.id;
		// Add icon to meta
		iconData[$chosenCategory].addIcon(icon);
		// Reload diffs
		// buildDiffs();
		// needSave = true;
	};

	const addCategory = async (folder: FileSystemDirectoryHandle) => {
		if (!iconData) return;
		// Get icons in folder
		let icons: RichFile[] = [];
		for await (const entry of getFilesRecursively(folder)) icons.push(entry);
		const richIcons = icons.map((i) => {
			return {
				id: nanoid(),
				ligature: i.name.replace(/\.svg$/, ''),
				name: i.name.replace(/\.svg$/, ''),
				url: i.name,
				width: 48,
				height: 48,
				tnp_id: '',
				tags: [],
				term: '',
				collections: [],
				file: i
			} as RichIcon;
		});

		// Create meta file
		const metaFile = await folder.getFileHandle('meta.json', { create: true }).then((file) => {
			file.createWritable().then((writer) => {
				writer.write(JSON.stringify({ category: folder.name, icons: [] }));
				writer.close();
			});
			return file;
		});

		// Create category
		const category = new RichCategory(metaFile, folder, {
			name: folder.name,
			icons: richIcons,
			newIcons: [],
			visible: true
		});

		category.save();

		// Add category to meta
		iconData.push(category);
		$chosenCategory = iconData.length;
		// Reload diffs
		// buildDiffs();
		needSave = true;
	};

	let needSave = false;
	if (browser) {
		window.onbeforeunload = function () {
			// https://stackoverflow.com/questions/1299452/how-do-i-stop-a-page-from-unloading-navigating-away-in-js
			if (needSave) {
				return 'You have made changes on this page that you have not yet confirmed. If you navigate away from this page you will lose your unsaved changes';
			}
		};
	}

	const loadData = async (handler: FileSystemDirectoryHandle | undefined = undefined) => {
		if (!handler) {
			fs = await IconFilesystem.getFilesystem();
		} else {
			fs = new IconFilesystem(handler);
		}
		iconData = await fs.categories;
		newCategories = fs.foundCategories;
		loading = false;

		// Parse tag data
		updateTagData();

		// Fix chosen category if out of bounds
		if ($chosenCategory > iconData.length - 1) {
			chosenCategory.set(0);
		}
		console.log(fs, iconData, newCategories);
	};

	const saveData = async () => {
		await fs.save();
		needSave = false;
	};
</script>

<h1 class="text-3xl font-bold">Canvas Icons Editor</h1>
<p class="mb-3">
	Welcome to the editor for Canvas Icons. This tool lets you add, remove, edit, and rearrange icons
	in each category.
</p>
{#if needSave}
	<div
		transition:slide|global
		class="my-3 rounded shadow bg-yellow-100 p-5 border-dashed border-2 border-yellow-400"
	>
		<p class="m-0 text-yellow-800">
			⚠️ You have unsaved changes. Please save or discard them before proceeding.
			<span class="btn-group inline float-right">
				<button class="btn" on:click={saveData}>Save</button>
				<button
					class="btn"
					on:click={() => {
						if (confirm('Are you sure you want to discard your changes?')) {
							loadData(fs.folderHandle);
							needSave = false;
						}
					}}>Discard</button
				>
			</span>
		</p>
	</div>
{/if}
{#if !loading && newCategories.length > 0}
	<p
		transition:slide|global
		class="my-3 rounded shadow bg-green-100 p-5 border-dashed border-2 border-green-400"
	>
		You have new folders in your repository. You can add them to the editor to begin editing icon
		metadata:
	</p>
	<div class="btn-group flex flex-wrap">
		{#each newCategories as newCategory}
			<button class="btn inline-block" on:click={() => addCategory(newCategory.folder)}
				>Add "{newCategory.category}"</button
			>
		{/each}
	</div>
{/if}
{#if loading}
	<button
		class="bg-black text-white rounded shadow p-3"
		on:click={() => {
			loadData();
		}}>Choose Folder</button
	>
{:else if !iconData || iconData.length === 0}
	<p
		transition:slide|global
		class="my-3 rounded shadow bg-yellow-100 p-5 border-dashed border-2 border-yellow-400"
	>
		Heads up! You don't have any categories. To begin, add a folder with some SVG icons to the <span
			class="font-mono bg-yellow-300 p-1 rounded">./icons/</span
		> directory in your fork of this repository.
	</p>
{:else}
	<div class="select-category flex flex-wrap">
		{#each iconData as category, index}
			<button
				class={`rounded ${
					$chosenCategory == index
						? 'bg-green-300 hover:bg-green-400'
						: 'bg-gray-100 hover:bg-gray-300'
				} ring-gray-200 ring-1 transition-all text-xs mr-0.5 mb-0.5 py-1 px-2 inline-block cursor-pointer select-none`}
				on:click={() => ($chosenCategory = index)}
			>
				{category.name}
			</button>
		{/each}
	</div>
	<!-- Two column layout for list and icon editing panel -->
	<div class="flex">
		<div class="icon-lists flex-grow-0 w-6/12 pr-5">
			<div class="changes">
				{#if iconData[$chosenCategory].added.length}
					<h2 class="text-xl font-bold mt-3">
						New Icons found:
						<!-- svelte-ignore missing-declaration -->
						<button
							class="btn inline float-right"
							on:click={async () => {
								for (const icon of iconData[$chosenCategory].newIcons) {
									addIcon(
										new CustomEvent('click', {
											detail: {
												id: nanoid(),
												ligature: icon.name.replace(/\.svg$/, ''),
												name: icon.name.replace(/\.svg$/, ''),
												url: icon.name,
												width: 48,
												height: 48,
												tnp_id: '',
												tags: [],
												term: '',
												file: icon,
												collections: []
											}
										})
									);
								}
							}}
						>
							Add All
						</button>
						<button
							class="btn inline float-right"
							on:click={async () => {
								for (const icon of iconData[$chosenCategory].newIcons) {
									const importedIcon = await nounFetch(icon, $nounProjectAuth);
									addIcon(new CustomEvent('click', { detail: importedIcon }));
								}
							}}
						>
							Add All + Load TNP
						</button>
					</h2>
					<!-- <IconList
						icons={iconData[$chosenCategory]?.newIcons.map((f) => ({ file: f }))}
						on:addIcon={addIcon}
						newIcons
					/> -->
				{/if}
				<!-- {#if iconDiffs[chosenCategory].removedIcons.length}
						<h2 class="text-xl font-bold mt-3">Deleted Icons found:</h2>
						<IconList icons={iconDiffs[chosenCategory].removedIcons} deletedIcons />
					{/if} -->
			</div>
			<h2 class="text-xl font-bold mt-3">Existing Icons:</h2>
			<!--  - Top matching icons -->
			<!-- on:selectIcon -->
			{#if iconData[$chosenCategory]}
				{#key $chosenCategory}
					<IconList
						bind:category={iconData[$chosenCategory]}
						on:edit={({ detail }) => {
							if (detail) iconData[$chosenCategory].icons = detail;
							needSave = true;
						}}
						on:addIcon={addIcon}
					/>
				{/key}
			{/if}
		</div>
		<div class="icon-editor w-6/12">
			<div class="card bg-white iconHeader">
				<!-- Show placeholder -->
				<div class="icon aspect-square flex items-center justify-center select-none">
					{#if $chosenIcon && chosenIconData && iconNotDeleted}
						{#await getIconUrl(chosenIconData) then src}
							<img {src} alt={chosenIconData.title} />
						{/await}
					{:else}
						<p class="text-white text-4xl font-thin">?</p>
					{/if}
				</div>
				{#if $chosenIcon && chosenIconData && iconNotDeleted}
					<!-- <h2 class="text-xl font-bold mt-3">Icon Editor:</h2> -->
					<IconForm
						icon={chosenIconData}
						{existingCollections}
						{existingTags}
						on:changed={({ detail }) => {
							needSave = true;
							if (!detail) return;
							const index = iconData[$chosenCategory]?.icons.findIndex((i) => i.id == $chosenIcon);
							if (index) iconData[$chosenCategory].icons[index] = detail;
						}}
						on:deleteIcon={(e) => {
							iconData[$chosenCategory].removeIcon(e.detail.id);
							// buildDiffs();
							// needSave = true;
						}}
					/>
				{:else}
					<p class="italic text-gray-700 text-center mt-24 mb-24 select-none">No icon selected.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
</style>

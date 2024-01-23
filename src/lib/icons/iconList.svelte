<script lang="ts">
	import { base, assets } from '$app/paths';
	import { flip } from 'svelte/animate';
	import { createEventDispatcher } from 'svelte';
	import type { Icon, RichCategory, RichFile, RichIcon } from '$lib/icons';
	import { getIconUrl } from '$lib/icons';
	import { dndzone, TRIGGERS } from 'svelte-dnd-action';
	import { chosenIcon } from '../../store';

	const dispatch = createEventDispatcher();
	export let category: { icons: RichIcon[] } | RichCategory;
	let icons = catisRichCategory(category) ? [...category.icons, ...category.added] : category.icons;

	function catisRichCategory(
		category: { icons: { file: RichFile }[] } | RichCategory
	): category is RichCategory {
		return 'name' in category;
	}

	// Handle movement of Drag&Drop icons, animation
	const flipDurationMs = 300;

	let iconsBeforeDrag = icons.slice();

	const handleSort = (e: CustomEvent<DndEvent>) => {
		if (
			e.type == 'finalize' &&
			e.detail.items.map((i) => i.id).join(',') != iconsBeforeDrag.map((i) => i.id).join(',')
		) {
			dispatch('edit', e.detail.items);
			iconsBeforeDrag = icons.slice();
		}
		icons = e.detail.items as RichIcon[];
	};

	const removeIcon = (icon: RichIcon) => {
		if (!catisRichCategory(category)) return;
		category.removeIcon(icon);
		dispatch('edit', icons);
	};

	const markMissing = (e: any, icon: RichIcon) => {
		e.target.src = `${base}/missing-icon.svg`;
	};

	const makeIcon = (icon: RichIcon) => {
		// Emit event telling the editor that this icon should be added to the meta
		dispatch('addIcon', icon);
	};
</script>

<div class="iconList">
	<div
		class="icons grid grid-cols-4 sm:grid-cols-8"
		use:dndzone={{ items: icons, flipDurationMs, dragDisabled: catisRichCategory(category) }}
		on:consider={handleSort}
		on:finalize={handleSort}
	>
		{#each icons as icon, i (icon.id)}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="icon"
				class:deleted={false}
				class:editing={$chosenIcon == icon.id}
				animate:flip={{ duration: flipDurationMs }}
				on:click={(e) => ($chosenIcon = $chosenIcon == icon.id ? null : icon.id)}
				title={icon.term}
			>
				{#if $chosenIcon == icon.id}
					<div class="editTools">
						{#if !catisRichCategory(category)}
							<div class="clone details-btn cursor-default" title="Add icon  to list">
								Drag to Add
							</div>
						{:else}
							<div
								role="button"
								class="delete details-btn"
								on:click={(_) => removeIcon(icon)}
								tabindex="0"
							>
								Delete
							</div>
						{/if}
					</div>
					<!-- <div
						class="details"
						on:click|stopPropagation={() => {
							return true;
						}}
					>
						<p class="px-1">
							<span class="break-words">{icon.url}</span>
							(<span>{icon.title}</span>)
						</p>
					</div> -->
				{/if}
				{#await getIconUrl(icon) then src}
					<img title={icon.url} {src} alt={icon.title} on:error={(e) => markMissing(e, icon)} />
				{/await}
			</div>
		{/each}
	</div>
</div>

<style lang="postcss">
	.icon {
		@apply relative p-0.5 m-1 transition-all duration-200 rounded bg-gray-50 hover:scale-110 hover:opacity-50;
		--select-colour: #4caf50;
		--select-colour-light: #4caf50aa;

		&.deleted.editing {
			--select-colour: #b43a3a;
			--select-colour-light: #b43a3aaa;
		}

		&.editing {
			box-shadow: 0px 0 1px 3px var(--select-colour);
			&:hover {
				opacity: 1;
				transform: unset;
				box-shadow: 0px 0 1px 3px var(--select-colour-light);
			}
		}

		.editTools,
		.details {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			transition: 0.33s ease transform;
			overflow: hidden;
			border-radius: 3rem;
			margin-bottom: 0.5rem;
			background: white;
			outline: 2px solid white;
			border: 2px solid var(--select-colour);
			font-size: 0.7rem;
			color: black;
			z-index: 15;
			&:hover {
				transform: translateX(-50%) scale(1.1);
			}
			.details-btn {
				cursor: pointer;
				padding: 0.5rem;
				&.delete:hover {
					background-color: #f443361e;
				}
			}
		}
		.editTools {
			bottom: 100%;
			font-weight: bold;
			cursor: default;
			display: flex;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}
</style>

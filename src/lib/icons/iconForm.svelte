<!-- @hmr:keep-all -->
<script lang="ts">
	import type { Icon } from '$lib/icons';
	import { slide } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import nounFetch from '$lib/icons/nounfetch';

	const dispatch = createEventDispatcher();

	import Tags from 'svelte-tags-input';

	export let icon: Icon;
	export let existingCollections: string[];
	export let existingTags: string[];
	// export let iconFileList;
	import { nounProjectAuth } from '../../store';

	let loading = false;
	$: loadingString = `Fetching data ${'.'.repeat((loadingInterval % 3) + 1)}${'&nbsp;'.repeat(
		3 - ((loadingInterval % 3) + 1)
	)}`;
	let loadingInterval = 0;
	let showTNPCreds = false;
	$: TNPCredsValid = $nounProjectAuth.key && $nounProjectAuth.secret;
	const fetchTNP = async () => {
		loading = true;
		loadingInterval = 0;
		const timer = setInterval(() => {
			loadingInterval += 1;
		}, 300);
		if (!TNPCredsValid) {
			loading = false;
			clearInterval(timer);
			return;
		}
		// Make the call to TNP
		icon = await nounFetch(icon, $nounProjectAuth);
		// We're Done! Cancel the loading and mark as complete
		loading = false;
		clearInterval(timer);
		dispatch('changed');
	};
</script>

{#if icon.tnp_id}
	<div class="btn-group">
		<div class="btn-group-tight">
			<button
				class="btn"
				class:active={loading}
				on:click={() => {
					if (TNPCredsValid && !showTNPCreds) {
						fetchTNP();
					} else {
						showTNPCreds = !showTNPCreds;
					}
				}}
			>
				{#if loading}
					{@html loadingString}
				{/if}
				{#if !loading}
					Fetch icon metadata from TNP
				{/if}
			</button>
			<button
				class="btn"
				title="Show TNP Credentials"
				on:click={() => {
					showTNPCreds = !showTNPCreds;
				}}
				class:active={showTNPCreds}
			>
				{#if showTNPCreds}
					&#9650;
				{:else}
					&#9660;
				{/if}
			</button>
		</div>
		<button
			class="btn danger"
			on:click={() => {
				dispatch('deleteIcon', icon);
			}}
		>
			Delete Icon
		</button>
	</div>
	{#if showTNPCreds}
		<div class="card bg-slate-100" transition:slide>
			<label class="form-label">
				<span> TNP API Key </span>
				<input
					disabled={loading}
					bind:value={$nounProjectAuth.key}
					placeholder="Enter your API Key here..."
				/>
			</label>
			<label class="form-label">
				<span> TNP API Secret </span>
				<input
					disabled={loading}
					bind:value={$nounProjectAuth.secret}
					type="password"
					placeholder="Enter your API Secret here..."
				/>
			</label>
			<button
				disabled={!TNPCredsValid || loading}
				class="btn"
				class:disabled={!TNPCredsValid || loading}
				class:pointer-events-none={!TNPCredsValid || loading}
				on:click={() => {
					if (TNPCredsValid) {
						showTNPCreds = false;
						fetchTNP();
					} else {
						showTNPCreds = !showTNPCreds;
					}
				}}
			>
				Start importing!
			</button>
		</div>
	{/if}
{/if}
<div class:disabled={loading} on:input={(e) => dispatch('changed')}>
	<label class="form-label">
		<span> Icon Title </span>
		<input
			disabled={loading}
			bind:value={icon.title}
			placeholder="What should the accessible name of the icon be?"
		/>
	</label>
	<label class="form-label">
		<span> Icon "Term" (from The Noun Project) </span>
		<input
			disabled={loading}
			bind:value={icon.term}
			placeholder="If the icon is from TNP, add the term here"
		/>
	</label>
	<label class="form-label">
		<span> Icon Path </span>
		<input
			bind:value={icon.url}
			placeholder="Path to SVG file, for example 'Teaching/noun_Network_3565311.svg'"
		/>
	</label>
	<label class="form-label">
		<span> The Noun Project source ID </span>
		<input
			disabled={loading}
			bind:value={icon.tnp_id}
			class:invalid={!/^\d+$|^$/.test(icon.tnp_id)}
		/>
	</label>
	<label class="form-label" for="iconTags">
		<span> Icon Tags </span>
		<Tags
			on:tags={() => dispatch('changed')}
			id="iconTags"
			addKeys={[9, 188, 13]}
			tags={icon.tags}
			allowPaste={true}
			onlyUnique={true}
			autoComplete={existingTags}
		/>
	</label>
	<label class="form-label" for="iconCollections">
		<span> The Noun Project "Collections" </span>
		<Tags
			on:tags={() => dispatch('changed')}
			id="iconCollections"
			addKeys={[9, 188, 13]}
			tags={icon.collections}
			allowPaste={true}
			onlyUnique={true}
			autoComplete={existingCollections}
		/>
	</label>
</div>

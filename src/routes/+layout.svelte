<script>
	import '../app.postcss';
</script>

<div class="wrapper bg-gray-700">
	<div class="app rounded-lg bg-gray-50 border-2 border-gray-200 shadow-xl px-6 py-5">
		<slot />
	</div>
</div>

<style lang="scss">
	.wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: top;
		height: 100vh;
		overflow: auto;
		.app {
			margin-top: 5vh;
			width: 70em;
			max-width: calc(100% - 2em);
		}
	}
</style>

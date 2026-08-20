<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { Tool } from '$lib/types';
	import Checkbox from '$lib/components/common/Checkbox.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';

	const i18n = getContext<Writable<{ t: (k: string) => string }>>('i18n');

	export let tools: Tool[] = [];
	export let selectedToolIds: string[] = [];

	let _tools: Record<string, Tool & { selected: boolean }> = {};

	/** Keep in sync with global `tools` store + selection (same as WebUI when new toolkits are added). */
	$: {
		_tools = (tools ?? []).reduce(
			(acc, tool) => {
				acc[tool.id] = {
					...tool,
					selected: selectedToolIds.includes(tool.id)
				};
				return acc;
			},
			{} as Record<string, Tool & { selected: boolean }>
		);
	}
</script>

<div>
	<div class="flex w-full justify-between mb-1">
		<div class=" self-center text-xs font-medium text-gray-500">{$i18n.t('Tools')}</div>
	</div>

	<div class="flex flex-col mb-1">
		{#if Object.keys(_tools).length > 0}
			<div class=" flex items-center flex-wrap">
				{#each Object.keys(_tools) as tool}
					<div class=" flex items-center gap-2 mr-3">
						<div class="self-center flex items-center">
							<Checkbox
								state={_tools[tool].selected ? 'checked' : 'unchecked'}
								on:change={(e) => {
									_tools[tool].selected = e.detail === 'checked';
									selectedToolIds = Object.keys(_tools).filter((t) => _tools[t].selected);
								}}
							/>
						</div>

						<Tooltip content={_tools[tool]?.meta?.description ?? _tools[tool].id}>
							<div class=" py-0.5 text-sm w-full capitalize font-medium">
								{_tools[tool].name}
							</div>
						</Tooltip>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class=" text-xs dark:text-gray-700">
		{$i18n.t('To select toolkits here, add them to the "Tools" workspace first.')}
	</div>
</div>

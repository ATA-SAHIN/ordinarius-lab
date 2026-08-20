<script lang="ts">
	import Checkbox from '$lib/components/common/Checkbox.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { OpenClawSkillItem } from '$lib/types';
	import { getSkillItems } from '$lib/apis/skills';

	export let selectedSkillIds: string[] = [];
	export let skills: OpenClawSkillItem[] | null = null;

	let _skills: Record<string, OpenClawSkillItem & { selected: boolean }> = {};

	const i18n = getContext<Writable<{ t: (k: string) => string }>>('i18n');

	const initSkills = (skillItems: OpenClawSkillItem[]) => {
		_skills = skillItems.reduce(
			(
				acc: Record<string, OpenClawSkillItem & { selected: boolean }>,
				skill: OpenClawSkillItem
			) => {
				acc[skill.id] = {
					...skill,
					selected: selectedSkillIds.includes(skill.id)
				};
				return acc;
			},
			{} as Record<string, OpenClawSkillItem & { selected: boolean }>
		);
	};

	let fetchedFallback: OpenClawSkillItem[] | null = null;

	onMount(async () => {
		if (!skills) {
			const res = await getSkillItems(localStorage.token).catch(() => null);
			fetchedFallback = res?.items ?? [];
		}
	});

	/** Parent passes OpenClaw catalog; refresh when list or selection changes (aligned with ToolsSelector). */
	$: {
		const list = skills ?? fetchedFallback ?? [];
		initSkills(list);
	}
</script>

<div>
	<div class="flex w-full justify-between mb-1">
		<div class=" self-center text-xs font-medium text-gray-500">{$i18n.t('Skills')}</div>
	</div>

	<div class="flex flex-col mb-1">
		{#if Object.keys(_skills).length > 0}
			<div class=" flex items-center flex-wrap">
				{#each Object.keys(_skills) as skill}
					<div class=" flex items-center gap-2 mr-3">
						<div class="self-center flex items-center">
							<Checkbox
								state={_skills[skill].selected ? 'checked' : 'unchecked'}
								on:change={(e) => {
									_skills[skill].selected = e.detail === 'checked';
									selectedSkillIds = Object.keys(_skills).filter((s) => _skills[s].selected);
								}}
							/>
						</div>

						<Tooltip content={_skills[skill]?.description ?? _skills[skill].id}>
							<div class=" py-0.5 text-sm w-full capitalize font-medium">
								{_skills[skill].name}
							</div>
						</Tooltip>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class=" text-xs dark:text-gray-700">
		{$i18n.t('To select skills here, add them to the "Skills" workspace first.')}
	</div>
</div>

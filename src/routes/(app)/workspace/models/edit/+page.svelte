<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	import { onMount, getContext } from 'svelte';
	const i18n = getContext('i18n') as any;

	import { page } from '$app/stores';
	import { config, models, settings } from '$lib/stores';

	import { getModelById, updateModelById } from '$lib/apis/models';

	import { getModels } from '$lib/apis';
	import ModelEditor from '$lib/components/workspace/Models/ModelEditor.svelte';

	let model: any = null;
	let loading = true;

	onMount(async () => {
		const _id = $page.url.searchParams.get('id');
		if (_id) {
			model = await getModelById(localStorage.token, _id).catch(() => null);

			if (!model) {
				goto('/workspace/models');
			} else if (!model?.write_access) {
				toast.error($i18n.t('You do not have permission to edit this OpenClaw profile'));
				goto('/workspace/models');
			}
		} else {
			goto('/workspace/models');
		}
		loading = false;
	});

	const onSubmit = async (modelInfo: any) => {
		const res = await updateModelById(localStorage.token, modelInfo.id, modelInfo);

		if (res) {
			await models.set(
				await getModels(
					localStorage.token,
					($config?.features?.enable_direct_connections &&
						($settings?.directConnections ?? null)) as any
				)
			);
			toast.success($i18n.t('OpenClaw profile updated successfully'));
			await goto('/workspace/models');
		}
	};
</script>

{#if loading}
	<div class="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-gray-500 dark:text-gray-400">
		<div
			class="size-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin"
			aria-hidden="true"
		/>
		<p class="text-sm">{$i18n.t('Loading...')}</p>
	</div>
{:else if model}
	<ModelEditor edit={true} {model} {onSubmit} />
{/if}

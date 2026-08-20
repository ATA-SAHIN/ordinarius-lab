<script>
	import { onMount } from 'svelte';
	import { config, models, settings } from '$lib/stores';
	import { getModels } from '$lib/apis';
	import { createNewModel, getBaseModels } from '$lib/apis/models';
	import { getOpenClawConfig } from '$lib/apis/openclaw';
	import {
		buildDefaultOpenClawWorkspaceModel,
		buildDefaultOpenClawSampleModel,
		OPENCLAW_SAMPLE_MODEL_ID,
		OPENCLAW_WORKSPACE_MODEL_ID
	} from '$lib/utils/openclawValves';
	import Models from '$lib/components/workspace/Models.svelte';

	onMount(async () => {
		const list = await getModels(
			localStorage.token,
			$config?.features?.enable_direct_connections ? $settings?.directConnections : null
		);
		models.set(list);

		const hasDefaultOpenClawSample = Array.isArray(list)
			? list.some((m) => m?.id === OPENCLAW_SAMPLE_MODEL_ID)
			: false;
		const hasDefaultWorkspaceModel = Array.isArray(list)
			? list.some((m) => m?.id === OPENCLAW_WORKSPACE_MODEL_ID)
			: false;

		if (!hasDefaultOpenClawSample || !hasDefaultWorkspaceModel) {
			try {
				const baseModels = await getBaseModels(localStorage.token);
				let firstBaseModelId =
					Array.isArray(baseModels) && baseModels.length > 0 ? baseModels[0].id : null;

				const cfgResponse = await getOpenClawConfig(localStorage.token);
				const cfg = cfgResponse?.config ?? {};

				if (!hasDefaultOpenClawSample) {
					const samplePayload = buildDefaultOpenClawSampleModel(cfg, firstBaseModelId);
					await createNewModel(localStorage.token, samplePayload);
					firstBaseModelId = OPENCLAW_SAMPLE_MODEL_ID;
				}

				if (!hasDefaultWorkspaceModel) {
					if (!firstBaseModelId) {
						console.warn('OpenClaw workspace model seed skipped: no base model available');
					} else {
						const workspacePayload = buildDefaultOpenClawWorkspaceModel(cfg, firstBaseModelId);
						await createNewModel(localStorage.token, workspacePayload);
					}
				}

				const refreshed = await getModels(
					localStorage.token,
					$config?.features?.enable_direct_connections ? $settings?.directConnections : null
				);
				models.set(refreshed);
			} catch (err) {
				console.warn('OpenClaw sample model seed skipped:', err);
			}
		}
	});
</script>

{#if $models !== null}
	<Models />
{/if}

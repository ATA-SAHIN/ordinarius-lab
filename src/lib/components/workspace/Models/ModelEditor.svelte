<script lang="ts">
	import { toast } from 'svelte-sonner';

	import { onMount, getContext, tick } from 'svelte';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { models, tools, functions, user } from '$lib/stores';
	import { WEBUI_BASE_URL, DEFAULT_CAPABILITIES } from '$lib/constants';

	import { getTools } from '$lib/apis/tools';
	import { getFunctions } from '$lib/apis/functions';
	import { listOpenClawForkRepos, type ForkRepoListItem } from '$lib/apis/openclawFork';
	import {
		getOpenClawConfig,
		updateOpenClawConfig,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		getOpenClawAvailableTools,
		getOpenClawAvailableSkills,
		getOpenClawAvailableCommands,
		getOpenClawAuditEvents,
		validateOpenClawConfig,
		exportOpenClawConfig,
		importOpenClawConfig,
		syncOpenClawModelConfig
	} from '$lib/apis/openclaw';
	import { getClawGateways } from '$lib/apis/claw_gateways';
	import { getClawSandboxes } from '$lib/apis/claw_sandboxes';
	import { getClawProviders } from '$lib/apis/claw_providers';
	import { getClawMemories } from '$lib/apis/claw_memories';
	import { getClawHooks } from '$lib/apis/claw_hooks';
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	import { capitalizeFirstLetter } from '$lib/utils';

	import AdvancedParams from '$lib/components/chat/Settings/Advanced/AdvancedParams.svelte';
	import Tags from '$lib/components/common/Tags.svelte';
	import Knowledge from '$lib/components/workspace/Models/Knowledge.svelte';
	import ToolsSelector from '$lib/components/workspace/Models/ToolsSelector.svelte';
	import SkillsSelector from '$lib/components/workspace/Models/SkillsSelector.svelte';
	import FiltersSelector from '$lib/components/workspace/Models/FiltersSelector.svelte';
	import ActionsSelector from '$lib/components/workspace/Models/ActionsSelector.svelte';
	import Capabilities from '$lib/components/workspace/Models/Capabilities.svelte';
	import Textarea from '$lib/components/common/Textarea.svelte';
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	import AccessControl from '../common/AccessControl.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	import XMark from '$lib/components/icons/XMark.svelte';
	import DefaultFiltersSelector from './DefaultFiltersSelector.svelte';
	import DefaultFeatures from './DefaultFeatures.svelte';
	import BuiltinTools from './BuiltinTools.svelte';
	import PromptSuggestions from './PromptSuggestions.svelte';
	import AccessControlModal from '../common/AccessControlModal.svelte';
	import LockClosed from '$lib/components/icons/LockClosed.svelte';
	import { updateModelAccessGrants } from '$lib/apis/models';
	import {
		MODEL_PROFILE_VERSION,
		buildModelRegistryEntry,
		hasModelRegistryDrift,
		normalizeBaseModelId
	} from '$lib/utils/modelRegistry';
	import { OPENCLAW_WORKSPACE_MODEL_ID } from '$lib/utils/openclawValves';
	import {
		normalizeOpenClawChannelsFromApi,
		normalizeOpenClawOrchestrationFromApi,
		denormalizeOpenClawChannelsForApi,
		denormalizeOpenClawOrchestrationForApi
	} from '$lib/utils/openclawConfigBridge';

	import ChannelsConfig from './ChannelsConfig.svelte';
	import PipelinesConfig from './PipelinesConfig.svelte';
	import OrchestrationConfig from './OrchestrationConfig.svelte';
	import AgentsConfig from './AgentsConfig.svelte';
	import OpenClawControlEmbedShell from './OpenClawControlEmbedShell.svelte';
	import { isOpenClawProfileModel } from '$lib/utils/openclawProfileGate';
	import { isOpenClawControlEmbedEnabled } from '$lib/utils/openclawControlEmbed';

	const i18n =
		getContext<
			import('svelte/store').Writable<{ t: (k: string, p?: Record<string, any>) => string }>
		>('i18n');
	import type {
		OpenClawModelInfo,
		ModelAdvancedParams,
		PromptSuggestion,
		KnowledgeItem,
		OpenClawOrchestrationConfig,
		OpenClawSkillItem,
		OpenClawCommandItem,
		Gateway,
		Provider,
		Sandbox,
		MemoryProfile,
		Hook,
		AccessGrant
	} from '$lib/types';
	import type { ChannelsConfig as ChannelsConfigType, PipelinesConfig as PipelinesConfigType } from '$lib/types';

	function emptyAdvancedParams(): ModelAdvancedParams {
		return {
			system: '',
			stream_response: null,
			stream_delta_chunk_size: null,
			function_calling: null,
			reasoning_tags: null,
			seed: null,
			stop: null,
			temperature: null,
			reasoning_effort: null,
			logit_bias: null,
			max_tokens: null,
			top_k: null,
			top_p: null,
			min_p: null,
			frequency_penalty: null,
			presence_penalty: null,
			mirostat: null,
			mirostat_eta: null,
			mirostat_tau: null,
			repeat_last_n: null,
			tfs_z: null,
			repeat_penalty: null,
			use_mmap: null,
			use_mlock: null,
			think: null,
			format: null,
			keep_alive: null,
			num_keep: null,
			num_ctx: null,
			num_batch: null,
			num_thread: null,
			num_gpu: null,
			custom_params: {}
		};
	}

	function defaultOpenClawModelInfo(): OpenClawModelInfo {
		return {
			id: '',
			base_model_id: null,
			name: '',
			meta: {
				profile_image_url: `${WEBUI_BASE_URL}/static/favicon.png`,
				description: '',
				suggestion_prompts: [] as PromptSuggestion[],
				tags: [] as { name: string }[],
				capabilities: { ...DEFAULT_CAPABILITIES } as Record<string, boolean | undefined>,
				knowledge: [] as Record<string, unknown>[]
			},
			params: {
				system: '',
				stream_response: null,
				stream_delta_chunk_size: null,
				function_calling: null,
				reasoning_tags: null,
				seed: null,
				stop: null,
				temperature: null,
				reasoning_effort: null,
				logit_bias: null,
				max_tokens: null,
				top_k: null,
				top_p: null,
				min_p: null,
				frequency_penalty: null,
				presence_penalty: null,
				mirostat: null,
				mirostat_eta: null,
				mirostat_tau: null,
				repeat_last_n: null,
				tfs_z: null,
				repeat_penalty: null,
				use_mmap: null,
				use_mlock: null,
				think: null,
				format: null,
				keep_alive: null,
				num_keep: null,
				num_ctx: null,
				num_batch: null,
				num_thread: null,
				num_gpu: null,
				custom_params: {}
			},
			access_grants: [] as AccessGrant[]
		};
	}

	export let onSubmit: (info: OpenClawModelInfo) => Promise<void>;
	export let onBack: null | (() => void) = null;

	export let model: OpenClawModelInfo | null = null;
	export let edit = false;

	export let isPreset = true;

	let loading = false;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let success = false;

	let filesInputElement: HTMLInputElement;
	let inputFiles: FileList | null = null;

	let showAdvanced = false;
	let showPreview = false;
	let showAccessControlModal = false;

	let loaded = false;

	let embedControlTab = 'config';
	$: useControlUiEmbed =
		!!model && isOpenClawProfileModel(model) && isOpenClawControlEmbedEnabled();

	// ///////////
	// model
	// ///////////

	let id = '';
	let name = '';

	let enableDescription = true;

	$: if (!edit) {
		if (name) {
			id = name
				.replace(/\s+/g, '-')
				.replace(/[^a-zA-Z0-9-]/g, '')
				.toLowerCase();
		}
	}

	let system = '';
	let info: OpenClawModelInfo = defaultOpenClawModelInfo();

	let params: ModelAdvancedParams = emptyAdvancedParams();

	let knowledge: KnowledgeItem[] = [];
	let toolIds: string[] = [];
	let skillIds: string[] = [];

	let filterIds: string[] = [];
	let defaultFilterIds: string[] = [];

	let capabilities: Record<string, boolean | undefined> = { ...DEFAULT_CAPABILITIES };
	let defaultFeatureIds: string[] = [];
	let builtinTools: Record<string, unknown> = {};

	let actionIds: string[] = [];
	let accessGrants: AccessGrant[] = [];

	let availableOpenClawSkills: OpenClawSkillItem[] = [];
	let availableOpenClawCommands: OpenClawCommandItem[] = [];

	let factoryGateways: Gateway[] = [];
	let factorySandboxes: Sandbox[] = [];
	let factoryProviders: Provider[] = [];
	let factoryMemories: MemoryProfile[] = [];
	let factoryHooks: Hook[] = [];

	const OPENCLAW_FORK_SESSION_KEY = 'openclaw_model_editor_fork_id';

	let forkRepos: ForkRepoListItem[] = [];
	let selectedForkId = '';
	/** True after user uploads a custom profile image (until reset or fork change with confirm). */
	let profileImageUserOverride = false;

	$: selectedFork = forkRepos.find((r) => r.fork_id === selectedForkId) ?? null;
	$: displayProfileImageUrl =
		!profileImageUserOverride && selectedFork?.avatar_url
			? selectedFork.avatar_url
			: (info.meta.profile_image_url as string);

	async function loadForkRepos() {
		if (!localStorage.token) return;
		try {
			const res = await listOpenClawForkRepos(localStorage.token);
			forkRepos = Array.isArray(res.repos) ? res.repos : [];
		} catch (e) {
			console.warn('listOpenClawForkRepos:', e);
			forkRepos = [];
		}
	}

	function applyForkSelection(nextId: string, opts?: { force?: boolean }) {
		const next = (nextId || '').trim();
		if (profileImageUserOverride && next !== selectedForkId && !opts?.force) {
			if (!window.confirm($i18n.t('Fork change may discard unsaved image edits. Continue?'))) {
				return;
			}
		}
		selectedForkId = next;
		profileImageUserOverride = false;
		if (typeof sessionStorage !== 'undefined') {
			if (next) sessionStorage.setItem(OPENCLAW_FORK_SESSION_KEY, next);
			else sessionStorage.removeItem(OPENCLAW_FORK_SESSION_KEY);
		}
	}

	/** Refetch toolkit + OpenClaw catalogs when returning to this page (e.g. new tool in workspace). */
	async function refreshWorkspaceCatalogs() {
		try {
			const [
				toolsList,
				functionsList,
				gateways,
				sandboxes,
				skills,
				commands,
				providers,
				memories,
				hooks
			] = await Promise.all([
				getTools(localStorage.token),
				getFunctions(localStorage.token),
				getClawGateways(localStorage.token),
				getClawSandboxes(localStorage.token),
				getOpenClawAvailableSkills(localStorage.token),
				getOpenClawAvailableCommands(localStorage.token),
				getClawProviders(localStorage.token),
				getClawMemories(localStorage.token),
				getClawHooks(localStorage.token)
			]);
			await tools.set(toolsList);
			await functions.set(functionsList);
			availableOpenClawSkills = Array.isArray(skills) ? skills : [];
			availableOpenClawCommands = Array.isArray(commands) ? commands : [];
			factoryGateways = gateways;
			factorySandboxes = sandboxes;
			factoryProviders = providers;
			factoryMemories = memories;
			factoryHooks = hooks;
			await loadForkRepos();
		} catch (e) {
			console.log('refreshWorkspaceCatalogs:', e);
		}
	}

	let skipFirstAfterNavigateCatalog = true;
	afterNavigate(({ to }) => {
		if (!to?.url?.pathname?.includes('/workspace/models/')) return;
		if (skipFirstAfterNavigateCatalog) {
			skipFirstAfterNavigateCatalog = false;
			return;
		}
		refreshWorkspaceCatalogs();
	});

	let gatewaySource = 'custom'; // 'custom' or 'factory'
	let sandboxSource = 'custom'; // 'custom' or 'factory'
	let providerSource = 'custom'; // 'custom' or 'factory'
	let memorySource = 'custom'; // 'custom' or 'factory'
	let hooksSource = 'custom'; // 'custom' or 'factory'

	let selectedGatewayId = '';
	let selectedSandboxId = '';
	let selectedProviderId = '';
	let selectedMemoryId = '';
	let selectedHookId = '';

	let tts = { voice: '' };

	// OpenClaw Configuration — mirrors ~/.openclaw/openclaw.json exactly
	let openclawConfig: OpenClawOrchestrationConfig = {
		agents: {
			defaults: {
				compaction: { mode: 'safeguard' as const },
				model: '' as string | { primary: string; fallbacks?: string[] },
				prompt_suggestions: [] as string[],
				knowledge_refs: [] as string[],
				command_catalog: [] as string[]
			},
			list: [] as Array<{ id: string; tools: Record<string, unknown>; model: string }>
		},
		models: {
			providers: {} as Record<
				string,
				{
					baseUrl: string;
					apiKey: string;
					api: string;
					models: Array<{ id: string; name: string }>;
				}
			>
		},
		commands: {
			native: 'auto' as const,
			nativeSkills: 'auto' as const,
			restart: true,
			ownerDisplay: 'raw',
			custom_commands: [] as Array<{
				id?: string;
				command: string;
				name?: string;
				content?: string;
				is_active?: boolean;
			}>
		},
		tools: {
			profile: 'full' as const,
			allow: [] as string[],
			deny: [] as string[],
			exec: {
				host: 'sandbox',
				security: 'deny',
				ask: 'on-miss',
				timeoutSec: 300,
				backgroundMs: 10000
			},
			web: {
				search: { enabled: true, provider: 'brave', maxResults: 5 },
				fetch: { enabled: true, maxChars: 10000, timeoutSeconds: 30, readability: true }
			},
			media: {
				image: { enabled: true, maxBytes: 10485760, maxChars: 10000 },
				audio: { enabled: true, maxBytes: 10485760, maxChars: 10000 },
				video: { enabled: true, maxBytes: 10485760, maxChars: 10000 }
			}
		},
		memory: {
			backend: 'builtin' as const,
			citations: 'auto' as const
		},
		skills: {
			entries: {} as Record<string, { enabled: boolean }>
		},
		gateway: {
			mode: 'local',
			host: '127.0.0.1',
			port: 18789,
			controlUi: {
				allowInsecureAuth: true,
				dangerouslyDisableDeviceAuth: true
			},
			auth: {
				mode: 'token',
				token: ''
			}
		},
		sandbox: {
			docker: {
				image: 'openclaw/sandbox:latest',
				memory: '4g',
				cpus: '2',
				networkMode: 'bridge'
			},
			browser: {
				enabled: true,
				headless: true,
				width: 1280,
				height: 720
			}
		},
		hooks: {
			list: [] as Array<{ event: string; action: string; enabled: boolean }>
		},
		channels: {
			telegram: undefined,
			discord: undefined,
			slack: undefined,
			matrix: undefined,
			defaultChannel: undefined
		} as ChannelsConfigType | undefined,
		pipelines: {
			list: [],
			defaultTimeout: 300,
			maxParallelPipelines: 5,
			enableLogging: true
		} as PipelinesConfigType | undefined,
		orchestration: {
			default_mode: 'AUTO' as 'SINGLE' | 'MULTI' | 'AUTO',
			timeout_seconds: 600,
			max_chain_depth: 5,
			delegation_rules: [] as any[],
			chain_presets: [] as any[],
			expert_timeouts: { RA: 120, Coder: 300, ITSec: 180 } as Record<string, number>,
			fallback_expert: 'RA',
			retry_on_failure: true,
			max_retries: 2,
			require_approval_for_high_risk: true,
			high_risk_keywords: [] as string[],
			token_budget_limit: 12000,
			max_parallel_experts: 1,
			crew_enabled: false,
			router_strategy: 'cost-aware'
		},
		policy: {
			killSwitch: { enabled: true },
			command: { allowlist: [] as string[] }
		},
		streaming: {
			fabric: {
				appendOnly: true,
				seqRequired: true
			}
		},
		scheduler: {
			heartbeat: { enabled: true },
			retry: { maxAttempts: 3 }
		},
		observability: {
			audit: { enabled: true },
			export: { retentionDays: 30 }
		},
		mcp_exposure: {
			enabled: true,
			default_decision: 'restricted'
		},
		execution_policy: {
			default_level: 'guided',
			god_mode_ttl_seconds: 900,
			require_hitl_for_god: true
		}
	};

	function onAgentsOpenClawChange() {
		openclawConfig = {
			...openclawConfig,
			agents: {
				...openclawConfig.agents,
				defaults: { ...openclawConfig.agents.defaults },
				list: [...(openclawConfig.agents.list ?? [])]
			}
		};
	}

	let openclawAutoSyncArmed = false;
	let openclawConfigSnapshot = '';
	let openClawAuditEvents: Array<Record<string, unknown>> = [];
	let openClawAuditLoading = false;
	let openClawAuditLimit = 50;
	let openClawAuditEventFilter = '';
	let openClawAuditActionFilter = '';
	let openClawAuditTotalMatched = 0;
	let openClawAuditAutoRefresh = false;
	let openClawAuditAutoRefreshSec = 5;
	let openClawAuditTimer: ReturnType<typeof setInterval> | null = null;
	let selectedAuditEvent: Record<string, unknown> | null = null;
	let openClawValidateResult: Record<string, unknown> | null = null;
	let openClawImportPayload = '';
	let openClawConfigOpsLoading = false;
	let openClawSyncDirection: 'openclaw_to_db' | 'db_to_openclaw' = 'openclaw_to_db';
	let openClawExportData: Record<string, unknown> | null = null;
	let openClawImportDryRun = true;
	let openClawImportDiffSummary: Record<string, unknown> | null = null;

	let panelOrchestrationOpen = false;
	let panelChannelsOpen = false;
	let panelPipelinesOpen = false;
	let panelAuditOpen = false;
	let panelLifecycleOpen = false;

	const AUDIT_EVENT_QUICK_FILTERS = [
		'',
		'openclaw.guardrail',
		'openclaw.execution.policy',
		'openclaw.structured.policy'
	];
	const AUDIT_ACTION_QUICK_FILTERS = ['', 'blocked', 'warned', 'approved', 'confirmed', 'bypass'];

	const fetchOpenClawAuditEvents = async () => {
		if (!localStorage.token) return;
		openClawAuditLoading = true;
		try {
			const response = await getOpenClawAuditEvents(localStorage.token, {
				limit: openClawAuditLimit,
				event: openClawAuditEventFilter || undefined,
				action: openClawAuditActionFilter || undefined
			});
			openClawAuditEvents = response?.events ?? [];
			openClawAuditTotalMatched = response?.total_matched ?? openClawAuditEvents.length;
		} catch (err) {
			console.error('Failed to load OpenClaw audit events:', err);
		} finally {
			openClawAuditLoading = false;
		}
	};

	const formatAuditTime = (value: unknown): string => {
		if (!value || typeof value !== 'string') return '-';
		const dt = new Date(value);
		if (Number.isNaN(dt.getTime())) return String(value);
		return dt.toLocaleString();
	};

	const selectAuditQuickEvent = (value: string) => {
		openClawAuditEventFilter = value;
		fetchOpenClawAuditEvents();
	};

	const selectAuditQuickAction = (value: string) => {
		openClawAuditActionFilter = value;
		fetchOpenClawAuditEvents();
	};

	const exportAuditEvents = () => {
		const payload = JSON.stringify(openClawAuditEvents, null, 2);
		const blob = new Blob([payload], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `openclaw-audit-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const setAuditAutoRefresh = () => {
		if (openClawAuditTimer) {
			clearInterval(openClawAuditTimer);
			openClawAuditTimer = null;
		}
		if (openClawAuditAutoRefresh) {
			const ms = Math.max(2, Number(openClawAuditAutoRefreshSec || 5)) * 1000;
			openClawAuditTimer = setInterval(() => {
				fetchOpenClawAuditEvents();
			}, ms);
		}
	};

	$: setAuditAutoRefresh();

	const runOpenClawValidation = async () => {
		if (!localStorage.token) return;
		openClawConfigOpsLoading = true;
		try {
			openClawValidateResult = await validateOpenClawConfig(
				localStorage.token,
				buildOpenClawApiPayload() as any
			);
			toast.success($i18n.t('Config validation completed.'));
		} catch (err) {
			console.error('OpenClaw validation failed:', err);
			toast.error($i18n.t('Config validation failed.'));
		} finally {
			openClawConfigOpsLoading = false;
		}
	};

	const runOpenClawExport = async () => {
		if (!localStorage.token) return;
		openClawConfigOpsLoading = true;
		try {
			openClawExportData = await exportOpenClawConfig(localStorage.token);
			const blob = new Blob([JSON.stringify(openClawExportData, null, 2)], {
				type: 'application/json'
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `openclaw-config-export-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success($i18n.t('Config export completed.'));
		} catch (err) {
			console.error('OpenClaw export failed:', err);
			toast.error($i18n.t('Config export failed.'));
		} finally {
			openClawConfigOpsLoading = false;
		}
	};

	const runOpenClawImport = async () => {
		if (!localStorage.token) return;
		if (!openClawImportPayload.trim()) {
			toast.error($i18n.t('Import payload is required.'));
			return;
		}
		openClawConfigOpsLoading = true;
		try {
			const parsed = JSON.parse(openClawImportPayload);
			const importResponse = await importOpenClawConfig(localStorage.token, {
				config: parsed?.config ?? parsed,
				merge: true,
				dry_run: openClawImportDryRun
			});
			openClawImportDiffSummary = importResponse?.diff_summary ?? null;
			if (openClawImportDryRun) {
				toast.success($i18n.t('Dry-run completed.'));
			} else {
				toast.success($i18n.t('Config import completed.'));
				await fetchOpenClawAuditEvents();
			}
		} catch (err) {
			console.error('OpenClaw import failed:', err);
			toast.error($i18n.t('Config import failed.'));
		} finally {
			openClawConfigOpsLoading = false;
		}
	};

	const runOpenClawModelSync = async () => {
		if (!localStorage.token) return;
		const modelId = id || model?.id;
		if (!modelId) {
			toast.error($i18n.t('OpenClaw profile ID is required for sync.'));
			return;
		}
		openClawConfigOpsLoading = true;
		try {
			await syncOpenClawModelConfig(localStorage.token, modelId, openClawSyncDirection, {
				forkId: selectedForkId || undefined
			});
			toast.success($i18n.t('Model config sync completed.'));
		} catch (err) {
			console.error('OpenClaw model sync failed:', err);
			toast.error($i18n.t('Model config sync failed.'));
		} finally {
			openClawConfigOpsLoading = false;
		}
	};

	// Debounced OpenClaw config sync
	let openclawSyncTimeout: ReturnType<typeof setTimeout> | null = null;
	let openclawSyncPending = false;
	let guardrailDialogOpen = false;
	let pendingCriticalGuardrailApproval = false;

	const cloneOpenClawConfig = (cfg: OpenClawOrchestrationConfig): OpenClawOrchestrationConfig =>
		JSON.parse(JSON.stringify(cfg));

	const buildOpenClawApiPayload = (): Record<string, unknown> => {
		const payload = cloneOpenClawConfig(openclawConfig) as unknown as Record<string, unknown>;
		denormalizeOpenClawChannelsForApi(payload.channels);
		denormalizeOpenClawOrchestrationForApi(payload.orchestration);
		return payload;
	};
	let lastCommittedOpenClawConfig: OpenClawOrchestrationConfig = cloneOpenClawConfig(openclawConfig);

	const CRITICAL_VALVE_PATHS: Array<{ path: string; label: string }> = [
		{
			path: 'gateway.controlUi.dangerouslyDisableDeviceAuth',
			label: 'Gateway: Disable Device Auth'
		},
		{ path: 'tools.exec.security', label: 'Tools: Execution Security' },
		{ path: 'orchestration.default_mode', label: 'Orchestration: Default mode' }
	];

	const readPath = (source: Record<string, any>, path: string): unknown =>
		path.split('.').reduce<unknown>((acc, part) => {
			if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
				return (acc as Record<string, unknown>)[part];
			}
			return undefined;
		}, source);

	const collectCriticalChanges = (
		beforeCfg: OpenClawOrchestrationConfig,
		afterCfg: OpenClawOrchestrationConfig
	): Array<{ path: string; label: string; before: unknown; after: unknown }> =>
		CRITICAL_VALVE_PATHS
			.map((item) => {
				const before = readPath(beforeCfg as Record<string, any>, item.path);
				const after = readPath(afterCfg as Record<string, any>, item.path);
				return { ...item, before, after };
			})
			.filter((item) => JSON.stringify(item.before) !== JSON.stringify(item.after));

	const emitGuardrailAudit = (
		action: 'confirmed' | 'denied',
		changes: Array<{ path: string; label: string; before: unknown; after: unknown }>
	) => {
		const detail = {
			action,
			ts: Date.now(),
			modelId: id || info.id || 'unknown',
			changes
		};
		window.dispatchEvent(new CustomEvent('openclaw.guardrail.' + action, { detail }));
		console.info('[OpenClaw][Guardrail]', detail);
	};

	const syncOpenClawConfig = async () => {
		if (openclawSyncTimeout) {
			clearTimeout(openclawSyncTimeout);
		}
		openclawSyncPending = true;
		openclawSyncTimeout = setTimeout(async () => {
			try {
				const { updateOpenClawConfig } = await import('$lib/apis/openclaw');
				await updateOpenClawConfig(localStorage.token, buildOpenClawApiPayload(), {
					guardrailConfirmed: pendingCriticalGuardrailApproval,
					forkId: selectedForkId || undefined
				});
				pendingCriticalGuardrailApproval = false;
				console.log('OpenClaw config synced');
				openclawSyncPending = false;
			} catch (err) {
				pendingCriticalGuardrailApproval = false;
				console.error('Failed to sync OpenClaw config:', err);
				openclawSyncPending = false;
			}
		}, 500); // 500ms debounce
	};

	const handleOpenClawChange = async () => {
		if (guardrailDialogOpen) return;
		const criticalChanges = collectCriticalChanges(lastCommittedOpenClawConfig, openclawConfig);
		if (criticalChanges.length > 0) {
			guardrailDialogOpen = true;
			const summary = criticalChanges
				.map((c) => `- ${c.label}: ${String(c.before)} -> ${String(c.after)}`)
				.join('\n');
			const approved = window.confirm(
				$i18n.t(
					'Critical OpenClaw policy change detected. Confirm to persist this update:\n\n{{summary}}',
					{ summary }
				)
			);
			guardrailDialogOpen = false;

			if (!approved) {
				openclawConfig = cloneOpenClawConfig(lastCommittedOpenClawConfig);
				emitGuardrailAudit('denied', criticalChanges);
				toast.warning($i18n.t('Critical policy change canceled.'));
				return;
			}

			emitGuardrailAudit('confirmed', criticalChanges);
			pendingCriticalGuardrailApproval = true;
			toast.success($i18n.t('Critical policy change confirmed.'));
		}

		lastCommittedOpenClawConfig = cloneOpenClawConfig(openclawConfig);
		syncOpenClawConfig();
	};

	$: if (openclawAutoSyncArmed) {
		const nextSnapshot = JSON.stringify(openclawConfig);
		if (nextSnapshot !== openclawConfigSnapshot) {
			openclawConfigSnapshot = nextSnapshot;
			handleOpenClawChange();
		}
	}

	// Keep original WebUI edit sections synchronized with OpenClaw config.
	$: openclawConfig.tools.allow = Array.isArray(toolIds) ? [...toolIds] : [];
	$: openclawConfig.skills.entries = Object.fromEntries(
		(Array.isArray(skillIds) ? skillIds : []).map((id) => [id, { enabled: true }])
	) as Record<string, { enabled: boolean }>;
	$: openclawConfig.agents.defaults.prompt_suggestions = Array.isArray(info?.meta?.suggestion_prompts)
		? info.meta.suggestion_prompts
				.map((item: any) => String(item?.content || '').trim())
				.filter((v: string) => v.length > 0)
		: [];
	$: openclawConfig.agents.defaults.knowledge_refs = Array.isArray(knowledge)
		? knowledge
				.map((item: any) => String(item?.id || item?.name || '').trim())
				.filter((v: string) => v.length > 0)
		: [];
	$: openclawConfig.agents.defaults.command_catalog = Array.isArray(availableOpenClawCommands)
		? availableOpenClawCommands
				.map((item: any) => String(item?.id || item?.name || '').trim())
				.filter((v: string) => v.length > 0)
		: [];

	/** Hydrate WebUI model card fields from the Models API model record. */
	async function applyOpenClawModelCardToForm(card: OpenClawModelInfo) {
		name = (card.name as string) ?? '';
		await tick();
		id = (card.id as string) ?? '';

		enableDescription = card?.meta?.description !== null;

		const normalizedBaseModelId = normalizeBaseModelId(
			card.base_model_id,
			($models as Array<{ id: string; preset?: boolean; arena?: boolean }>)
				.filter((m) => !m?.preset && !(m?.arena ?? false))
				.map((m) => ({ id: m.id }))
		);

		system = (card?.params as any)?.system ?? '';

		params = { ...emptyAdvancedParams(), ...(card?.params as any) };
		params.stop = (params.stop as string | string[] | undefined)
			? (typeof (params.stop as any) === 'string'
					? (params.stop as string).split(',')
					: (params.stop as string[]) || []
				).join(',')
			: null;

		knowledge = ((card?.meta as any)?.knowledge ?? []).map((item: Record<string, unknown>) => {
			if (item?.collection_name && item?.type !== 'file') {
				return {
					id: item.collection_name,
					name: item.name,
					legacy: true
				};
			} else if (item?.collection_names) {
				return {
					name: item.name,
					type: 'collection',
					collection_names: item.collection_names,
					legacy: true
				};
			} else {
				return item;
			}
		});

		toolIds = card?.meta?.toolIds ?? [];
		skillIds = card?.meta?.skillIds ?? [];
		filterIds = card?.meta?.filterIds ?? [];
		defaultFilterIds = card?.meta?.defaultFilterIds ?? [];
		actionIds = card?.meta?.actionIds ?? [];

		capabilities = { ...DEFAULT_CAPABILITIES, ...(card?.meta?.capabilities ?? {}) } as Record<
			string,
			boolean | undefined
		>;
		defaultFeatureIds = card?.meta?.defaultFeatureIds ?? [];
		builtinTools = card?.meta?.builtinTools ?? {};
		tts = { voice: card?.meta?.tts?.voice ?? '' };

		accessGrants = card?.access_grants ?? [];

		const merged = JSON.parse(
			JSON.stringify({
				...card,
				base_model_id: normalizedBaseModelId
			})
		) as OpenClawModelInfo;

		info = {
			...defaultOpenClawModelInfo(),
			...merged
		};

		info.meta = info.meta ?? {};
		info.params = info.params ?? {};
	}

	function coerceAgentDefaultModelId(raw: unknown): string | null {
		if (raw == null) return null;
		if (typeof raw === 'string') return raw.trim() === '' ? null : raw;
		if (typeof raw === 'object' && raw !== null && 'id' in raw) {
			const mid = (raw as { id?: unknown }).id;
			return typeof mid === 'string' && mid.trim() !== '' ? mid : null;
		}
		return null;
	}

	/**
	 * After ~/.openclaw/openclaw.json is merged into openclawConfig, push engine fields into the
	 * WebUI form for the workspace default card. Without this, tools.allow / agents.defaults.model
	 * live only in openclawConfig while toolIds / base model stay empty (checkboxes look "disconnected").
	 */
	function syncOpenClawWorkspaceCardFromMergedConfig() {
		if (!model || (model.id as string) !== OPENCLAW_WORKSPACE_MODEL_ID) return;

		const rawModel = (openclawConfig.agents?.defaults as { model?: unknown } | undefined)?.model;
		const m = coerceAgentDefaultModelId(rawModel);
		if (m) {
			const normalized = normalizeBaseModelId(
				m,
				($models as Array<{ id: string; preset?: boolean; arena?: boolean }>)
					.filter((x) => !x?.preset && !(x?.arena ?? false))
					.map((x) => ({ id: x.id }))
			);
			if (normalized) {
				info = { ...info, base_model_id: normalized };
			}
		}

		const allow = openclawConfig.tools?.allow;
		if (Array.isArray(allow) && allow.length > 0) {
			toolIds = [...allow];
		}

		const entries = openclawConfig.skills?.entries;
		if (entries && typeof entries === 'object') {
			const next = Object.entries(entries)
				.filter(([, v]) => {
					if (!v || typeof v !== 'object') return false;
					return (v as { enabled?: boolean }).enabled !== false;
				})
				.map(([k]) => k);
			if (next.length > 0) {
				skillIds = next;
			}
		}

		info.meta = {
			...info.meta,
			toolIds: [...toolIds],
			skillIds: [...skillIds]
		};
	}

	const submitHandler = async () => {
		loading = true;

		info.id = id;
		info.name = name;

		if (id === '') {
			toast.error($i18n.t('OpenClaw profile ID is required.'));
			loading = false;

			return;
		}

		if (name === '') {
			toast.error($i18n.t('OpenClaw profile name is required.'));
			loading = false;

			return;
		}

		if (knowledge.some((item) => item.status === 'uploading')) {
			toast.error($i18n.t('Please wait until all files are uploaded.'));
			loading = false;

			return;
		}

		info.params = { ...info.params, ...params };
		info.meta.profileVersion = MODEL_PROFILE_VERSION;
		const previousRegistry = info.meta.modelRegistry;

		const normalizedBaseModelId = normalizeBaseModelId(
			info.base_model_id,
			($models as Array<{ id: string; name: string; preset?: boolean; owned_by?: string; direct?: boolean }>)
				.filter((m) => !m?.preset && m?.owned_by !== 'arena' && !(m?.direct ?? false))
		);
		info.base_model_id = normalizedBaseModelId;
		info.meta.modelRegistry = buildModelRegistryEntry({
			cardModelId: info.id,
			baseModelId: normalizedBaseModelId
		});

		if (hasModelRegistryDrift({ registry: previousRegistry, baseModelId: normalizedBaseModelId })) {
			toast.warning($i18n.t('Model registry drift detected and auto-corrected.'));
		}

		// Keep OpenClaw default model aligned with model card base model.
		if (normalizedBaseModelId) {
			openclawConfig.agents.defaults.model = normalizedBaseModelId;
		}

		info.access_grants = accessGrants;
		info.meta.capabilities = capabilities;

		if (enableDescription) {
			info.meta.description =
				(info.meta.description || '').trim() === '' ? '' : info.meta.description;
		} else {
			info.meta.description = '';
		}

		if (knowledge.length > 0) {
			info.meta.knowledge = knowledge;
		} else {
			info.meta.knowledge = [];
		}

		if (toolIds.length > 0) {
			info.meta.toolIds = toolIds;
		} else {
			info.meta.toolIds = [];
		}

		if (skillIds.length > 0) {
			info.meta.skillIds = skillIds;
		} else {
			info.meta.skillIds = [];
		}

		if (filterIds.length > 0) {
			info.meta.filterIds = filterIds;
		} else {
			info.meta.filterIds = [];
		}

		if (defaultFilterIds.length > 0) {
			info.meta.defaultFilterIds = defaultFilterIds;
		} else {
			if (info.meta.defaultFilterIds) {
				delete info.meta.defaultFilterIds;
			}
		}

		if (actionIds.length > 0) {
			info.meta.actionIds = actionIds;
		} else {
			if (info.meta.actionIds) {
				delete info.meta.actionIds;
			}
		}

		if (defaultFeatureIds.length > 0) {
			info.meta.defaultFeatureIds = defaultFeatureIds;
		} else {
			if (info.meta.defaultFeatureIds) {
				delete info.meta.defaultFeatureIds;
			}
		}

		if (Object.keys(builtinTools).length > 0) {
			info.meta.builtinTools = builtinTools;
		} else {
			if (info.meta.builtinTools) {
				delete info.meta.builtinTools;
			}
		}

		if (tts.voice !== '') {
			if (!info.meta.tts) info.meta.tts = {};
			info.meta.tts.voice = tts.voice;
		} else {
			if (info.meta.tts?.voice) {
				delete info.meta.tts.voice;
				if (Object.keys(info.meta.tts).length === 0) {
					delete info.meta.tts;
				}
			}
		}

		info.params.system = system.trim() === '' ? null : system;
		if (params && (params as Record<string, unknown>).stop) {
			info.params.stop = (
				typeof (params as Record<string, unknown>).stop === 'string'
					? ((params as Record<string, unknown>).stop as string).split(',')
					: ((params as Record<string, unknown>).stop as string[])
			).filter((s: string) => s.trim());
		} else {
			info.params.stop = null;
		}

		Object.keys(info.params).forEach((key) => {
			if (
				(info.params as Record<string, any>)[key] === '' ||
				(info.params as Record<string, any>)[key] === null
			) {
				delete (info.params as Record<string, any>)[key];
			}
		});

		if (selectedForkId) {
			info.meta.fork_id = selectedForkId;
		} else {
			delete info.meta.fork_id;
		}

		const controlEmbed =
			!!model && isOpenClawProfileModel(model) && isOpenClawControlEmbedEnabled();
		if (!controlEmbed) {
			try {
				await updateOpenClawConfig(localStorage.token, buildOpenClawApiPayload(), {
					forkId: selectedForkId || undefined
				});
			} catch (err) {
				console.error('Failed to save OpenClaw config:', err);
				toast.error($i18n.t('Failed to save OpenClaw configuration.'));
				loading = false;
				return;
			}
		}

		await onSubmit(info);

		loading = false;
		success = false;
	};

	onMount(async () => {
		const [toolsList, functionsList, factoryResults] = await Promise.all([
			getTools(localStorage.token),
			getFunctions(localStorage.token),
			Promise.allSettled([
				getClawGateways(localStorage.token),
				getClawSandboxes(localStorage.token),
				getOpenClawAvailableSkills(localStorage.token),
				getOpenClawAvailableCommands(localStorage.token),
				getClawProviders(localStorage.token),
				getClawMemories(localStorage.token),
				getClawHooks(localStorage.token)
			])
		]);
		await tools.set(toolsList);
		await functions.set(functionsList);
		const pick = <T,>(i: number, fallback: T): T => {
			const r = factoryResults[i];
			if (r?.status === 'fulfilled' && r.value != null) return r.value as T;
			if (r?.status === 'rejected') console.warn('OpenClaw factory fetch failed:', r.reason);
			return fallback;
		};
		factoryGateways = pick(0, factoryGateways);
		factorySandboxes = pick(1, factorySandboxes);
		availableOpenClawSkills = pick(2, []);
		availableOpenClawCommands = pick(3, []);
		factoryProviders = pick(4, factoryProviders);
		factoryMemories = pick(5, factoryMemories);
		factoryHooks = pick(6, factoryHooks);

		// Scroll to top 'workspace-container' element
		const workspaceContainer = document.getElementById('workspace-container');
		if (workspaceContainer) {
			workspaceContainer.scrollTop = 0;
		}

		loaded = true;
		await tick();

		if (model) {
			await applyOpenClawModelCardToForm(model);
		}

		await loadForkRepos();
		const qpFork = $page.url.searchParams.get('fork_id');
		let initialFork = '';
		if (qpFork) initialFork = qpFork.trim();
		else if (info.meta.fork_id) initialFork = String(info.meta.fork_id).trim();
		else if (typeof sessionStorage !== 'undefined') {
			const s = sessionStorage.getItem(OPENCLAW_FORK_SESSION_KEY);
			if (s) initialFork = s.trim();
		}
		if (initialFork) applyForkSelection(initialFork, { force: true });
		await tick();

		// Load OpenClaw config — merge runs after rAF so the shell stays clickable (no long sync block on first paint).
		const skipMonolithOpenClawFetch =
			!!model && isOpenClawProfileModel(model) && isOpenClawControlEmbedEnabled();
		try {
			if (!skipMonolithOpenClawFetch) {
			const ocGlobal = await getOpenClawConfig(localStorage.token, {
				forkId: selectedForkId || undefined
			});
			if (ocGlobal?.config) {
				await tick();
				await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
				const cfg = ocGlobal.config;
				if (cfg.agents) {
					if (cfg.agents.defaults) {
						openclawConfig.agents.defaults = {
							...openclawConfig.agents.defaults,
							...cfg.agents.defaults
						};
						if (cfg.agents.defaults.compaction) {
							openclawConfig.agents.defaults.compaction = {
								...openclawConfig.agents.defaults.compaction,
								...cfg.agents.defaults.compaction
							};
						}
					}
					if (Array.isArray(cfg.agents.list)) {
						openclawConfig.agents.list = cfg.agents.list;
					} else if (cfg.agents.list == null) {
						openclawConfig.agents.list = openclawConfig.agents.list ?? [];
					}
				}
				if (!Array.isArray(openclawConfig.agents.list)) {
					openclawConfig.agents.list = [];
				}
				if (!openclawConfig.agents.defaults.compaction) {
					openclawConfig.agents.defaults.compaction = { mode: 'safeguard' };
				}
				if (cfg.models?.providers) {
					openclawConfig.models.providers = cfg.models.providers;
				}
				if (cfg.commands) {
					openclawConfig.commands = { ...openclawConfig.commands, ...cfg.commands };
				}
				if (cfg.gateway) {
					openclawConfig.gateway = { ...openclawConfig.gateway, ...cfg.gateway };
					if (cfg.gateway.controlUi) {
						openclawConfig.gateway.controlUi = {
							...openclawConfig.gateway.controlUi,
							...cfg.gateway.controlUi
						};
					}
					if (cfg.gateway.auth) {
						openclawConfig.gateway.auth = { ...openclawConfig.gateway.auth, ...cfg.gateway.auth };
					}
				}
				if (cfg.skills?.entries) {
					openclawConfig.skills.entries = cfg.skills.entries;
				}
				if (cfg.tools) {
					// Deeply merge tools to avoid nulling sub-objects
					openclawConfig.tools = {
						...openclawConfig.tools,
						...cfg.tools,
						exec: {
							...openclawConfig.tools.exec,
							...(cfg.tools.exec ?? {})
						},
						web: {
							...openclawConfig.tools.web,
							...(cfg.tools.web ?? {}),
							search: {
								...openclawConfig.tools.web.search,
								...(cfg.tools.web?.search ?? {})
							},
							fetch: {
								...openclawConfig.tools.web.fetch,
								...(cfg.tools.web?.fetch ?? {})
							}
						},
						media: {
							...openclawConfig.tools.media,
							...(cfg.tools.media ?? {}),
							image: {
								...openclawConfig.tools.media.image,
								...(cfg.tools.media?.image ?? {})
							},
							audio: {
								...openclawConfig.tools.media.audio,
								...(cfg.tools.media?.audio ?? {})
							},
							video: {
								...openclawConfig.tools.media.video,
								...(cfg.tools.media?.video ?? {})
							}
						}
					};
				}
				if (cfg.memory) {
					openclawConfig.memory = { ...openclawConfig.memory, ...cfg.memory };
				}
				const memCit = openclawConfig.memory?.citations;
				if (memCit === 'always') openclawConfig.memory.citations = 'on';
				if (memCit === 'never') openclawConfig.memory.citations = 'off';
				if (!openclawConfig.memory.search) {
					openclawConfig.memory.search = {
						enabled: true,
						sources: ['memory'],
						provider: 'openai'
					};
				}
				if (cfg.sandbox) {
					// Deeply merge sandbox to avoid nulling sub-objects
					openclawConfig.sandbox = {
						...openclawConfig.sandbox,
						...cfg.sandbox,
						docker: {
							...openclawConfig.sandbox.docker,
							...(cfg.sandbox.docker ?? {})
						},
						browser: {
							...openclawConfig.sandbox.browser,
							...(cfg.sandbox.browser ?? {})
						}
					};
				}
				if (cfg.hooks?.list) {
					openclawConfig.hooks.list = cfg.hooks.list;
				}
				// Load orchestration config
				if (cfg.orchestration) {
					openclawConfig.orchestration = {
						...openclawConfig.orchestration,
						...cfg.orchestration
					};
				}
				// Load channels config
				if (cfg.channels) {
					openclawConfig.channels = {
						...openclawConfig.channels,
						...cfg.channels
					};
				}
				// Load pipelines config
				if (cfg.pipelines) {
					openclawConfig.pipelines = {
						...openclawConfig.pipelines,
						...cfg.pipelines
					};
				}
				if (cfg.policy) {
					openclawConfig.policy = {
						...openclawConfig.policy,
						...cfg.policy,
						command: {
							...openclawConfig.policy.command,
							...(cfg.policy.command || {})
						},
						killSwitch: {
							...openclawConfig.policy.killSwitch,
							...(cfg.policy.killSwitch || {})
						}
					};
				}
				if (cfg.streaming) {
					openclawConfig.streaming = {
						...openclawConfig.streaming,
						...cfg.streaming,
						fabric: {
							...openclawConfig.streaming.fabric,
							...(cfg.streaming.fabric || {})
						}
					};
				}
				if (cfg.scheduler) {
					openclawConfig.scheduler = {
						...openclawConfig.scheduler,
						...cfg.scheduler,
						heartbeat: {
							...openclawConfig.scheduler.heartbeat,
							...(cfg.scheduler.heartbeat || {})
						},
						retry: {
							...openclawConfig.scheduler.retry,
							...(cfg.scheduler.retry || {})
						}
					};
				}
				if (cfg.observability) {
					openclawConfig.observability = {
						...openclawConfig.observability,
						...cfg.observability,
						audit: {
							...openclawConfig.observability.audit,
							...(cfg.observability.audit || {})
						},
						export: {
							...openclawConfig.observability.export,
							...(cfg.observability.export || {})
						}
					};
				}
				if (cfg.mcp_exposure) {
					openclawConfig.mcp_exposure = {
						...openclawConfig.mcp_exposure,
						...cfg.mcp_exposure
					};
				}
				if (cfg.execution_policy) {
					openclawConfig.execution_policy = {
						...openclawConfig.execution_policy,
						...cfg.execution_policy
					};
				}
				normalizeOpenClawChannelsFromApi(openclawConfig.channels);
				normalizeOpenClawOrchestrationFromApi(openclawConfig.orchestration);
				if (model && (model.id as string) === OPENCLAW_WORKSPACE_MODEL_ID) {
					syncOpenClawWorkspaceCardFromMergedConfig();
					await tick();
				}
				openclawConfig = openclawConfig;
			}
			}
		} catch (err) {
			console.log('OpenClaw config not available:', err);
		}
		lastCommittedOpenClawConfig = cloneOpenClawConfig(openclawConfig);
		openclawConfigSnapshot = JSON.stringify(openclawConfig);
		openclawAutoSyncArmed = true;

		setTimeout(() => {
			fetchOpenClawAuditEvents();
		}, 0);
	});
</script>

{#if loaded}
	<AccessControlModal
		bind:show={showAccessControlModal}
		bind:accessGrants
		accessRoles={isPreset ? ['read', 'write'] : ['read']}
		share={$user?.permissions?.sharing?.models || $user?.role === 'admin'}
		sharePublic={$user?.permissions?.sharing?.public_models || $user?.role === 'admin'}
		shareUsers={($user?.permissions?.access_grants?.allow_users ?? true) || $user?.role === 'admin'}
		onChange={async () => {
			if (edit && model?.id) {
				try {
					await updateModelAccessGrants(
						localStorage.token,
						model.id as string,
						(model.name as string) ?? name,
						accessGrants
					);
					toast.success($i18n.t('Saved'));
				} catch (error) {
					const e = error as Record<string, string>;
					toast.error(e?.detail || e?.message || String(e));
				}
			}
		}}
	/>

	{#if onBack}
		<button
			class="flex space-x-1"
			on:click={() => {
				onBack();
			}}
		>
			<div class=" self-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="h-4 w-4"
				>
					<path
						fill-rule="evenodd"
						d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div class=" self-center text-sm font-medium">{$i18n.t('Back')}</div>
		</button>
	{/if}

	{#if useControlUiEmbed && model}
		<div class="w-full max-h-full flex flex-col gap-4 px-2 pb-8">
			<p class="text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
				{$i18n.t(
					'Runtime OpenClaw settings are managed in the embedded Control UI (gateway). Saving updates this profile card via the Models API only.'
				)}
			</p>
			<div class="flex flex-col gap-1 max-w-xl w-full">
				<div class="text-xs text-gray-500 dark:text-gray-400">{$i18n.t('Name')}</div>
				<input
					class="w-full rounded-lg py-2 text-sm bg-transparent border border-gray-200 dark:border-gray-800 px-3"
					type="text"
					bind:value={name}
					required
				/>
			</div>
			<OpenClawControlEmbedShell {model} bind:selectedTab={embedControlTab} />
			<div class="flex justify-end max-w-xl w-full">
				<button
					type="button"
					class="text-sm px-4 py-2 rounded-lg bg-black hover:bg-gray-900 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black disabled:opacity-50"
					disabled={loading}
					on:click={() => submitHandler()}
				>
					{$i18n.t('Save profile')}
				</button>
			</div>
		</div>
	{:else}
	<div class="w-full max-h-full flex justify-center">
		<input
			bind:this={filesInputElement}
			bind:files={inputFiles}
			type="file"
			hidden
			accept="image/*"
			on:change={() => {
				let reader = new FileReader();
				reader.onload = (event) => {
					let originalImageUrl = `${event.target?.result}`;

					// For animated formats (gif, webp), skip resizing to preserve animation
					const fileType = inputFiles?.[0]?.type;
					if (fileType === 'image/gif' || fileType === 'image/webp') {
						profileImageUserOverride = true;
						info.meta.profile_image_url = originalImageUrl;
						inputFiles = null;
						filesInputElement.value = '';
						return;
					}

					const img = new Image();
					img.src = originalImageUrl;

					img.onload = function () {
						const canvas = document.createElement('canvas');
						const ctx = canvas.getContext('2d');

						// Calculate the aspect ratio of the image
						const aspectRatio = img.width / img.height;

						// Calculate the new width and height to fit within 100x100
						let newWidth, newHeight;
						if (aspectRatio > 1) {
							newWidth = 250 * aspectRatio;
							newHeight = 250;
						} else {
							newWidth = 250;
							newHeight = 250 / aspectRatio;
						}

						// Set the canvas size
						canvas.width = 250;
						canvas.height = 250;

						// Calculate the position to center the image
						const offsetX = (250 - newWidth) / 2;
						const offsetY = (250 - newHeight) / 2;

						// Draw the image on the canvas
						if (ctx) {
							ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
						}

						// Get the base64 representation of the compressed image
						const compressedSrc = canvas.toDataURL('image/webp', 0.8);

						// Display the compressed image
						profileImageUserOverride = true;
						info.meta.profile_image_url = compressedSrc;

						inputFiles = null;
						filesInputElement.value = '';
					};
				};

				if (
					inputFiles &&
					inputFiles.length > 0 &&
					['image/gif', 'image/webp', 'image/jpeg', 'image/png', 'image/svg+xml'].includes(
						inputFiles[0]?.type || ''
					)
				) {
					reader.readAsDataURL(inputFiles[0]);
				} else {
					console.log(`Unsupported File Type '${inputFiles?.[0]?.type}'.`);
					inputFiles = null;
				}
			}}
		/>

		{#if !edit || (edit && model)}
			<form
				class="flex flex-col w-full gap-3 md:gap-6"
				on:submit|preventDefault={() => {
					submitHandler();
				}}
			>
				<div class="w-full px-1">
					<details
						class="mb-2 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
					>
						<summary
							class="cursor-pointer font-medium text-gray-600 dark:text-gray-300 list-none [&::-webkit-details-marker]:hidden"
						>
							{$i18n.t('OpenClawFieldMapDetailsSummary')}
						</summary>
						<ul class="mt-2 list-disc pl-4 space-y-1.5 leading-relaxed">
							<li>{$i18n.t('OpenClawFieldMapDetailsBullet1')}</li>
							<li>{$i18n.t('OpenClawFieldMapDetailsBullet2')}</li>
							<li>{$i18n.t('OpenClawFieldMapDetailsBullet3')}</li>
							<li>
								{$i18n.t('OpenClawFieldMapDetailsBullet4')}
								<code class="ml-1 text-[10px] opacity-90">docs/OPENCLAW_MODEL_EDITOR_FIELD_MAP.md</code>
							</li>
						</ul>
					</details>
					<div class="flex flex-row gap-4 md:gap-6 w-full">
						<div class="self-start flex flex-col justify-center my-2 shrink-0 max-w-[12rem] md:max-w-none">
							<label class="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1" for="openclaw-fork-select"
								>{$i18n.t('OpenClaw fork context')}</label
							>
							<select
								id="openclaw-fork-select"
								data-testid="openclaw-fork-select"
								class="text-xs mb-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent py-1 px-2"
								bind:value={selectedForkId}
								on:change={() => applyForkSelection(selectedForkId)}
							>
								<option value="">{$i18n.t('No fork selected')}</option>
								{#each forkRepos as r (r.fork_id)}
									<option value={r.fork_id}>{r.display_name} · {r.motor_group_key ?? 'default'}</option>
								{/each}
							</select>
							{#if selectedFork}
								<div class="text-[10px] text-gray-500 dark:text-gray-400 mb-2 leading-snug">
									{$i18n.t('Fork avatar in use — upload replaces it until reset')}
								</div>
							{/if}
							<div class="self-center">
								<button
									class="rounded-2xl flex shrink-0 items-center {displayProfileImageUrl !==
									`${WEBUI_BASE_URL}/static/favicon.png`
										? 'bg-transparent'
										: 'bg-white'} shadow-xl group relative"
									type="button"
									aria-label={$i18n.t('Upload profile image')}
									on:click={() => {
										filesInputElement.click();
									}}
								>
									{#if displayProfileImageUrl}
										<img
											src={displayProfileImageUrl}
											alt="model profile"
											class="rounded-xl size-20 md:size-48 object-cover shrink-0"
										/>
									{:else}
										<img
											src="{WEBUI_BASE_URL}/static/favicon.png"
											alt="model profile"
											class=" rounded-xl size-20 md:size-48 object-cover shrink-0"
										/>
									{/if}

									<div class="absolute bottom-0 right-0 z-10">
										<div class="m-1.5">
											<div
												class="shadow-xl p-1 rounded-full border-2 border-white bg-gray-800 text-white group-hover:bg-gray-600 transition dark:border-black dark:bg-white dark:group-hover:bg-gray-200 dark:text-black"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 16 16"
													fill="currentColor"
													class="size-5"
												>
													<path
														fill-rule="evenodd"
														d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm10.5 5.707a.5.5 0 0 0-.146-.353l-1-1a.5.5 0 0 0-.708 0L9.354 9.646a.5.5 0 0 1-.708 0L6.354 7.354a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0-.146.353V12a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9.707ZM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
														clip-rule="evenodd"
													/>
												</svg>
											</div>
										</div>
									</div>

									<div
										class="absolute top-0 bottom-0 left-0 right-0 bg-white dark:bg-black rounded-lg opacity-0 group-hover:opacity-20 transition"
									></div>
								</button>

								<div class="flex w-full mt-1 justify-end">
									<button
										class="px-2 py-1 text-gray-500 rounded-lg text-xs"
										on:click={() => {
											profileImageUserOverride = false;
											if (selectedFork?.avatar_url) {
												info.meta.profile_image_url = selectedFork.avatar_url;
											} else {
												info.meta.profile_image_url = `${WEBUI_BASE_URL}/static/favicon.png`;
											}
										}}
										type="button"
									>
										{$i18n.t('Reset Image')}</button
									>
								</div>
							</div>
						</div>

						<div class="flex flex-col w-full flex-1">
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
								Models API: info.name · info.id · meta.* (image, description, tags)
							</div>
							<div class="flex justify-between items-start my-2">
								<div class=" flex flex-col w-full">
									<div class="flex-1 w-full">
										<input
											class="text-3xl w-full bg-transparent outline-hidden"
											placeholder={$i18n.t('OpenClaw profile name')}
											bind:value={name}
											required
										/>
									</div>

									<div class="flex-1 w-full">
										<div>
											<input
												class="text-xs w-full bg-transparent outline-hidden"
												placeholder={$i18n.t('OpenClaw profile ID')}
												bind:value={id}
												disabled={edit}
												required
											/>
										</div>
									</div>
								</div>

								<div class="shrink-0">
									<button
										class="bg-gray-50 shrink-0 hover:bg-gray-100 text-black dark:bg-gray-850 dark:hover:bg-gray-800 dark:text-white transition px-2 py-1 rounded-full flex gap-1 items-center"
										type="button"
										on:click={() => {
											showAccessControlModal = true;
										}}
									>
										<LockClosed strokeWidth="2.5" className="size-3.5 shrink-0" />

										<div class="text-sm font-medium shrink-0">
											{$i18n.t('Access')}
										</div>
									</button>
								</div>
							</div>

							{#if isPreset}
								<div class="mb-1">
									<div class=" text-xs font-medium mb-1 text-gray-500">
										{$i18n.t('Base Model (From)')}
									</div>
									<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
										info.base_model_id · on save → agents.defaults.model
									</div>

									<div>
										<select
											class="text-sm w-full bg-transparent outline-hidden"
											placeholder={$i18n.t('Select a base model (e.g. llama3, gpt-4o)')}
											bind:value={info.base_model_id}
											required
										>
											<option value={null} class=" text-gray-900"
												>{$i18n.t('Select a base model')}</option
											>
											{#each ($models as Array<{ id: string; name: string; preset?: boolean; owned_by?: string; direct?: boolean }>).filter((m) => (model ? m.id !== model.id : true) && !m?.preset && m?.owned_by !== 'arena' && !(m?.direct ?? false)) as m}
												<option value={m.id} class=" text-gray-900">{m.name}</option>
											{/each}
										</select>
									</div>
								</div>
							{/if}

							<div class="mb-1">
								<div class="mb-1 flex w-full justify-between items-center">
									<div class=" self-center text-xs font-medium text-gray-500">
										{$i18n.t('Description')}
									</div>

									<button
										class="p-1 text-xs flex rounded-sm transition"
										type="button"
										aria-pressed={enableDescription ? 'true' : 'false'}
										aria-label={enableDescription
											? $i18n.t('Custom description enabled')
											: $i18n.t('Default description enabled')}
										on:click={() => {
											enableDescription = !enableDescription;
										}}
									>
										{#if !enableDescription}
											<span class="ml-2 self-center">{$i18n.t('Default')}</span>
										{:else}
											<span class="ml-2 self-center">{$i18n.t('Custom')}</span>
										{/if}
									</button>
								</div>

								{#if enableDescription}
									<Textarea
										className=" text-sm w-full bg-transparent outline-hidden resize-none overflow-y-hidden "
										placeholder={$i18n.t('Add a short description about what this model does')}
										bind:value={info.meta.description}
									/>
								{/if}
							</div>

							<div class="w-full mb-1 max-w-full">
								<div class="">
									<Tags
										tags={info?.meta?.tags ?? []}
										on:delete={(e) => {
											const tagName = e.detail;
											info.meta.tags = info.meta.tags.filter(
												(tag: { name: string }) => tag.name !== tagName
											);
										}}
										on:add={(e) => {
											const tagName = e.detail;
											if (!(info?.meta?.tags ?? null)) {
												info.meta.tags = [{ name: tagName }];
											} else {
												info.meta.tags = [...info.meta.tags, { name: tagName }];
											}
										}}
									/>
								</div>
							</div>
						</div>
					</div>

					<div class="my-2">
						<div class="flex w-full justify-between">
							<div class=" self-center text-xs font-medium text-gray-500">
								{$i18n.t('Model Params')}
							</div>
						</div>
						<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
							Models API: params.system · params.* (advanced)
						</div>

						<div class="mt-2">
							<div class="my-1">
								<div class=" text-xs font-medium mb-2">{$i18n.t('System Prompt')}</div>
								<div>
									<Textarea
										className=" text-sm w-full bg-transparent outline-hidden resize-none overflow-y-hidden "
										placeholder={$i18n.t(
											'Write your model system prompt content here\ne.g.) You are Mario from Super Mario Bros, acting as an assistant.'
										)}
										rows={4}
										bind:value={system}
									/>
								</div>
							</div>

							<div class="flex w-full justify-between">
								<div class=" self-center text-xs font-medium">
									{$i18n.t('Advanced Params')}
								</div>

								<button
									class="p-1 px-3 text-xs flex rounded-sm transition"
									type="button"
									on:click={() => {
										showAdvanced = !showAdvanced;
									}}
								>
									{#if showAdvanced}
										<span class="ml-2 self-center">{$i18n.t('Hide')}</span>
									{:else}
										<span class="ml-2 self-center">{$i18n.t('Show')}</span>
									{/if}
								</button>
							</div>

							{#if showAdvanced}
								<div class="my-2">
									<AdvancedParams admin={true} custom={true} bind:params />
								</div>
							{/if}
						</div>
					</div>

					<hr class=" border-gray-100/30 dark:border-gray-850/30 my-2" />

					<div class="my-2">
						<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
							meta.suggestion_prompts → mirror agents.defaults.prompt_suggestions
						</div>
						<div class="flex w-full justify-between items-center">
							<div class="flex w-full justify-between items-center">
								<div class=" self-center text-xs font-medium text-gray-500">
									{$i18n.t('Prompts')}
								</div>

								<button
									class="p-1 text-xs flex rounded-sm transition"
									type="button"
									on:click={() => {
										if ((info?.meta?.suggestion_prompts ?? null) === null) {
											info.meta.suggestion_prompts = [{ content: '', title: ['', ''] }];
										} else {
											info.meta.suggestion_prompts = null;
										}
									}}
								>
									{#if (info?.meta?.suggestion_prompts ?? null) === null}
										<span class="ml-2 self-center">{$i18n.t('Default')}</span>
									{:else}
										<span class="ml-2 self-center">{$i18n.t('Custom')}</span>
									{/if}
								</button>
							</div>
						</div>

						{#if info?.meta?.suggestion_prompts}
							<PromptSuggestions bind:promptSuggestions={info.meta.suggestion_prompts} />
						{/if}
					</div>

					<div class="my-4">
						<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
							meta.knowledge → mirror agents.defaults.knowledge_refs
						</div>
						<Knowledge bind:selectedItems={knowledge} />
					</div>

					<div class="my-4">
						<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
							meta.toolIds → mirror tools.allow
						</div>
						<ToolsSelector bind:selectedToolIds={toolIds} tools={$tools ?? []} />
					</div>

					<div class="my-4">
						<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
							meta.skillIds → mirror skills.entries
						</div>
						<SkillsSelector bind:selectedSkillIds={skillIds} skills={availableOpenClawSkills} />
					</div>

					{#if availableOpenClawCommands.length > 0}
						<div class="my-4">
							<div class="flex w-full justify-between mb-1">
								<div class=" self-center text-xs font-medium text-gray-500">
									{$i18n.t('Commands')}
								</div>
							</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">
								UI: GET /openclaw/available-commands · mirror agents.defaults.command_catalog
							</div>
							<div class="flex flex-wrap gap-2">
								{#each availableOpenClawCommands as command}
									<div
										class="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-850 rounded-lg text-sm border border-gray-100 dark:border-gray-800"
									>
										<span class="text-xs">⌨️</span>
										<span class="font-medium"
											>{(command.name as string) || (command.id as string)}</span
										>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- OpenClaw engine fields (same layout as WebUI sections above) -->
					<hr class=" border-gray-100/30 dark:border-gray-850/30 my-2" />

						<!-- Valve categories integrated directly into original OpenClaw Advanced panel -->
						<div class="my-4">
							<div class="text-xs font-medium text-gray-500 mb-0.5">{$i18n.t('Policy')}</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2 break-all">
								orchestration.require_approval_for_high_risk · policy.killSwitch · policy.command.allowlist ·
								execution_policy.*
							</div>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
								<label class="flex items-center gap-2">
									<input type="checkbox" bind:checked={openclawConfig.orchestration.require_approval_for_high_risk} class="rounded" />
									<span class="text-xs">{$i18n.t('HITL Required (High Risk)')}</span>
								</label>
								<label class="flex items-center gap-2">
									<input type="checkbox" bind:checked={openclawConfig.policy.killSwitch.enabled} class="rounded" />
									<span class="text-xs">{$i18n.t('Kill Switch Enabled')}</span>
								</label>
							</div>
							<div class="mt-2">
								<div class="text-xs text-gray-400 mb-1">{$i18n.t('Command Allowlist (comma-separated)')}</div>
								<input
									class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
									type="text"
									value={(openclawConfig.policy.command.allowlist || []).join(',')}
									on:change={(e) => {
										openclawConfig.policy.command.allowlist = String((e.target as HTMLInputElement).value || '')
											.split(',')
											.map((v) => v.trim())
											.filter(Boolean);
									}}
								/>
							</div>
							<div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
								<div>
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Default execution level')}</div>
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={openclawConfig.execution_policy.default_level}
									>
										<option value="sandbox">sandbox</option>
										<option value="guided">guided</option>
										<option value="god">god</option>
									</select>
								</div>
								<div>
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('God mode TTL (seconds)')}</div>
									<input
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										type="number"
										min="60"
										bind:value={openclawConfig.execution_policy.god_mode_ttl_seconds}
									/>
								</div>
								<label class="flex items-center gap-2 mt-5 md:mt-0">
									<input
										type="checkbox"
										class="rounded"
										bind:checked={openclawConfig.execution_policy.require_hitl_for_god}
									/>
									<span class="text-xs">{$i18n.t('Require HITL for god mode')}</span>
								</label>
							</div>
						</div>

						<div class="my-4">
							<div class="text-xs font-medium text-gray-500 mb-0.5">{$i18n.t('Streaming & Scheduler')}</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">
								streaming.fabric.* · scheduler.heartbeat · scheduler.retry
							</div>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
								<label class="flex items-center gap-2">
									<input type="checkbox" bind:checked={openclawConfig.streaming.fabric.appendOnly} class="rounded" />
									<span class="text-xs">{$i18n.t('Append-Only')}</span>
								</label>
								<label class="flex items-center gap-2">
									<input type="checkbox" bind:checked={openclawConfig.streaming.fabric.seqRequired} class="rounded" />
									<span class="text-xs">{$i18n.t('Seq Required')}</span>
								</label>
								<label class="flex items-center gap-2">
									<input type="checkbox" bind:checked={openclawConfig.scheduler.heartbeat.enabled} class="rounded" />
									<span class="text-xs">{$i18n.t('Heartbeat Enabled')}</span>
								</label>
								<div>
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Retry Max Attempts')}</div>
									<input class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1" type="number" min="0" max="20" bind:value={openclawConfig.scheduler.retry.maxAttempts} />
								</div>
							</div>
						</div>

						<div class="my-4">
							<div class="text-xs font-medium text-gray-500 mb-0.5">{$i18n.t('Observability & IDE Bridge')}</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">
								observability.audit · observability.export · mcp_exposure.*
							</div>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
								<label class="flex items-center gap-2">
									<input type="checkbox" bind:checked={openclawConfig.observability.audit.enabled} class="rounded" />
									<span class="text-xs">{$i18n.t('Audit Enabled')}</span>
								</label>
								<div>
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Retention Days')}</div>
									<input class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1" type="number" min="1" max="3650" bind:value={openclawConfig.observability.export.retentionDays} />
								</div>
								<label class="flex items-center gap-2">
									<input type="checkbox" bind:checked={openclawConfig.mcp_exposure.enabled} class="rounded" />
									<span class="text-xs">{$i18n.t('MCP Enabled')}</span>
								</label>
								<div>
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('MCP Tool Scope')}</div>
									<select class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1" bind:value={openclawConfig.mcp_exposure.default_decision}>
										<option value="restricted">restricted</option>
										<option value="balanced">balanced</option>
										<option value="full">full</option>
									</select>
								</div>
							</div>
						</div>

						<!-- agents: openclaw.json agents.defaults + agents.list (full OpenClaw shape) -->
						<div class="my-4">
							<div class="text-xs font-medium text-gray-500 mb-0.5">
								{$i18n.t('Agents')} (openclaw.json)
							</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">agents.defaults · agents.list</div>
							<AgentsConfig bind:config={openclawConfig.agents} on:change={onAgentsOpenClawChange} />
						</div>

						<!-- commands -->
						<div class="my-4">
							<div class="flex w-full justify-between mb-0.5">
								<div class="self-center text-xs font-medium text-gray-500">
									{$i18n.t('Commands')}
								</div>
							</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">
								commands.native · commands.nativeSkills · commands.ownerDisplay · commands.restart ·
								commands.custom_commands
							</div>
							<div class="flex gap-4">
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Native')}</div>
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={openclawConfig.commands.native}
									>
										<option value="auto">{$i18n.t('Auto')}</option>
										<option value="on">{$i18n.t('On')}</option>
										<option value="off">{$i18n.t('Off')}</option>
									</select>
								</div>
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Native Skills')}</div>
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={openclawConfig.commands.nativeSkills}
									>
										<option value="auto">{$i18n.t('Auto')}</option>
										<option value="on">{$i18n.t('On')}</option>
										<option value="off">{$i18n.t('Off')}</option>
									</select>
								</div>
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Owner Display')}</div>
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={openclawConfig.commands.ownerDisplay}
									>
										<option value="raw">{$i18n.t('Raw')}</option>
										<option value="pretty">{$i18n.t('Pretty')}</option>
									</select>
								</div>
							</div>
							<div class="mt-2">
								<label class="flex items-center gap-2">
									<input
										type="checkbox"
										bind:checked={openclawConfig.commands.restart}
										class="rounded"
									/>
									<span class="text-xs">{$i18n.t('Allow Restart')}</span>
								</label>
							</div>
						</div>

						<!-- skills.entries -->
						<div class="my-4">
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
								skills.entries · card checkboxes sync here (reactive, same as tools.allow)
							</div>
							<div class="flex w-full justify-between mb-1">
								<div class="self-center text-xs font-medium text-gray-500">
									{$i18n.t('Skills')}
								</div>
								<button
									class="px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
									type="button"
									on:click={() => {
										const skillName = prompt($i18n.t('Enter skill name'));
										if (skillName) {
											openclawConfig.skills.entries = {
												...openclawConfig.skills.entries,
												[skillName]: { enabled: true }
											};
										}
									}}
								>
									+ {$i18n.t('Add Skill')}
								</button>
							</div>
							{#each Object.entries(openclawConfig.skills.entries) as [skillName, skillCfg]}
								<div class="flex gap-2 items-center mb-1">
									<span class="flex-1 text-sm">{skillName}</span>
									<label class="flex items-center gap-1">
										<input type="checkbox" bind:checked={skillCfg.enabled} class="rounded" />
										<span class="text-xs">{$i18n.t('Enabled')}</span>
									</label>
									<button
										class="text-xs text-red-400 hover:text-red-600 transition"
										type="button"
										on:click={() => {
											// eslint-disable-next-line @typescript-eslint/no-unused-vars
											const { [skillName]: _, ...rest } = openclawConfig.skills.entries;
											openclawConfig.skills.entries = rest;
										}}>✕</button
									>
								</div>
							{/each}
							{#if Object.keys(openclawConfig.skills.entries).length === 0}
								<div class="text-xs text-gray-400">{$i18n.t('No skills configured')}</div>
							{/if}
						</div>
						<div class="my-4">
							<div class="text-xs font-medium text-gray-500 mb-0.5">
								{$i18n.t('Gateway Configuration')}
							</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">
								gateway.mode · gateway.host · gateway.port · gateway.controlUi.* · gateway.auth.*
							</div>
							<div class="flex gap-2 mb-2">
								<button
									type="button"
									class="px-2 py-1 text-xs rounded-lg {gatewaySource === 'custom'
										? 'bg-black text-white'
										: 'bg-gray-100 dark:bg-gray-800'}"
									on:click={() => (gatewaySource = 'custom')}
								>
									{$i18n.t('Custom')}
								</button>
								<button
									type="button"
									class="px-2 py-1 text-xs rounded-lg {gatewaySource === 'factory'
										? 'bg-black text-white'
										: 'bg-gray-100 dark:bg-gray-800'}"
									on:click={() => (gatewaySource = 'factory')}
								>
									{$i18n.t('Factory Module')}
								</button>
							</div>

							{#if gatewaySource === 'factory'}
								<select
									class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
									bind:value={selectedGatewayId}
									on:change={() => {
										const gw = factoryGateways.find((g) => g.id === selectedGatewayId);
										if (gw) {
											openclawConfig.gateway.mode = gw.mode;
											openclawConfig.gateway.host = gw.host;
											openclawConfig.gateway.port = gw.port;
											openclawConfig.gateway.controlUi!.allowInsecureAuth = gw.allow_insecure_auth;
											openclawConfig.gateway.controlUi!.dangerouslyDisableDeviceAuth =
												gw.disable_device_auth;
										}
									}}
								>
									<option value="" disabled>{$i18n.t('Select a Gateway')}</option>
									{#each factoryGateways as gw}
										<option value={gw.id}>{gw.name}</option>
									{/each}
								</select>
							{:else}
								<div class="flex gap-4">
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Mode')}</div>
										<select
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											bind:value={openclawConfig.gateway.mode}
										>
											<option value="local">{$i18n.t('Local')}</option>
											<option value="remote">{$i18n.t('Remote')}</option>
										</select>
									</div>
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Host')}</div>
										<input
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											type="text"
											bind:value={openclawConfig.gateway.host}
											placeholder="127.0.0.1"
										/>
									</div>
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Port')}</div>
										<input
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											type="number"
											bind:value={openclawConfig.gateway.port}
										/>
									</div>
								</div>

								<div class="flex gap-4 mt-2">
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={openclawConfig.gateway.controlUi!.allowInsecureAuth}
											class="rounded"
										/>
										<span class="text-xs">{$i18n.t('Allow Insecure Auth')}</span>
									</label>
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={openclawConfig.gateway.controlUi!.dangerouslyDisableDeviceAuth}
											class="rounded"
										/>
										<span class="text-xs">{$i18n.t('Disable Device Auth')}</span>
									</label>
								</div>
							{/if}
						</div>

						<!-- tools.exec -->
						<div class="my-4">
							<div class="flex w-full justify-between mb-0.5">
								<div class="self-center text-xs font-medium text-gray-500">
									{$i18n.t('Tools Configuration')}
								</div>
							</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">
								tools.profile · tools.allow / deny · tools.exec · tools.web · tools.media · allow mirrors
								card toolIds
							</div>
							<div class="flex gap-4">
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Profile')}</div>
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={openclawConfig.tools.profile}
									>
										<option value="full">{$i18n.t('Full')}</option>
										<option value="minimal">{$i18n.t('Minimal')}</option>
										<option value="none">{$i18n.t('None')}</option>
									</select>
								</div>
							</div>
							<div class="mt-2">
								<div class="text-xs text-gray-400 mb-1">{$i18n.t('Execution')}</div>
								<div class="flex gap-4">
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Host')}</div>
										<select
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											bind:value={openclawConfig.tools.exec.host}
										>
											<option value="sandbox">{$i18n.t('Sandbox')}</option>
											<option value="local">{$i18n.t('Local')}</option>
										</select>
									</div>
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Security')}</div>
										<select
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											bind:value={openclawConfig.tools.exec.security}
										>
											<option value="deny">{$i18n.t('Deny')}</option>
											<option value="allow">{$i18n.t('Allow')}</option>
											<option value="ask">{$i18n.t('Ask')}</option>
										</select>
									</div>
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Ask Mode')}</div>
										<select
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											bind:value={openclawConfig.tools.exec.ask}
										>
											<option value="on-miss">{$i18n.t('On Miss')}</option>
											<option value="always">{$i18n.t('Always')}</option>
											<option value="never">{$i18n.t('Never')}</option>
										</select>
									</div>
								</div>
								<div class="flex gap-4 mt-2">
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Timeout (sec)')}</div>
										<input
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											type="number"
											bind:value={openclawConfig.tools.exec.timeoutSec}
										/>
									</div>
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Background (ms)')}</div>
										<input
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											type="number"
											bind:value={openclawConfig.tools.exec.backgroundMs}
										/>
									</div>
								</div>
							</div>
							<div class="mt-2">
								<div class="text-xs text-gray-400 mb-1">{$i18n.t('Web')}</div>
								<div class="flex gap-4">
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={openclawConfig.tools.web.search.enabled}
											class="rounded"
										/>
										<span class="text-xs">{$i18n.t('Web Search')}</span>
									</label>
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={openclawConfig.tools.web.fetch.enabled}
											class="rounded"
										/>
										<span class="text-xs">{$i18n.t('Web Fetch')}</span>
									</label>
								</div>
							</div>
							<div class="mt-2">
								<div class="text-xs text-gray-400 mb-1">{$i18n.t('Media')}</div>
								<div class="flex gap-4">
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={openclawConfig.tools.media.image.enabled}
											class="rounded"
										/>
										<span class="text-xs">{$i18n.t('Image')}</span>
									</label>
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={openclawConfig.tools.media.audio.enabled}
											class="rounded"
										/>
										<span class="text-xs">{$i18n.t('Audio')}</span>
									</label>
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={openclawConfig.tools.media.video.enabled}
											class="rounded"
										/>
										<span class="text-xs">{$i18n.t('Video')}</span>
									</label>
								</div>
							</div>
						</div>

						<!-- models/providers -->
						<div class="my-4">
							<div class="flex w-full justify-between mb-0.5">
								<div class="self-center text-xs font-medium text-gray-500">
									{$i18n.t('LLM Provider Factory')}
								</div>
							</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">
								models.providers.*
							</div>

							<div class="my-2">
								<div class="flex gap-2 mb-2">
									<button
										type="button"
										class="px-2 py-1 text-xs rounded-lg {providerSource === 'custom'
											? 'bg-black text-white'
											: 'bg-gray-100 dark:bg-gray-800'}"
										on:click={() => (providerSource = 'custom')}
									>
										{$i18n.t('Current Config')}
									</button>
									<button
										type="button"
										class="px-2 py-1 text-xs rounded-lg {providerSource === 'factory'
											? 'bg-black text-white'
											: 'bg-gray-100 dark:bg-gray-800'}"
										on:click={() => (providerSource = 'factory')}
									>
										{$i18n.t('Factory Provider')}
									</button>
								</div>

								{#if providerSource === 'factory'}
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1 font-medium"
										bind:value={selectedProviderId}
										on:change={() => {
											const prov = factoryProviders.find((p) => p.id === selectedProviderId);
											if (prov) {
												// Create or update the provider entry in the local config object
												const provKey = prov.name.toLowerCase().replace(/\s+/g, '_');
												openclawConfig.models.providers[provKey] = {
													baseUrl: prov.base_url,
													apiKey: prov.api_key,
													api: prov.api_version || 'openai',
													models: []
												};
												toast.info($i18n.t('Linked Provider: ') + prov.name);
											}
										}}
									>
										<option value="" disabled>{$i18n.t('Select a Provider')}</option>
										{#each factoryProviders as prov}
											<option value={prov.id}>{prov.name}</option>
										{/each}
									</select>
								{/if}
							</div>
						</div>

						<!-- memory -->
						<div class="my-4">
							<div class="flex w-full justify-between mb-0.5">
								<div class="self-center text-xs font-medium text-gray-500">
									{$i18n.t('Memory')}
								</div>
							</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">memory.*</div>

							<div class="my-2">
								<div class="flex gap-2 mb-2">
									<button
										type="button"
										class="px-2 py-1 text-xs rounded-lg {memorySource === 'custom'
											? 'bg-black text-white'
											: 'bg-gray-100 dark:bg-gray-800'}"
										on:click={() => (memorySource = 'custom')}
									>
										{$i18n.t('Custom')}
									</button>
									<button
										type="button"
										class="px-2 py-1 text-xs rounded-lg {memorySource === 'factory'
											? 'bg-black text-white'
											: 'bg-gray-100 dark:bg-gray-800'}"
										on:click={() => (memorySource = 'factory')}
									>
										{$i18n.t('Factory Profile')}
									</button>
								</div>

								{#if memorySource === 'factory'}
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1 font-medium"
										bind:value={selectedMemoryId}
										on:change={() => {
											const mem = factoryMemories.find((m) => m.id === selectedMemoryId);
											if (mem) {
												openclawConfig.memory.backend = 'external';
												// In a real scenario, we might map more fields here
												toast.info($i18n.t('Linked Memory Profile: ') + mem.name);
											}
										}}
									>
										<option value="" disabled>{$i18n.t('Select a Profile')}</option>
										{#each factoryMemories as mem}
											<option value={mem.id}>{mem.name}</option>
										{/each}
									</select>
								{/if}
							</div>

							<div class="flex gap-4">
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Backend')}</div>
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={openclawConfig.memory.backend}
									>
										<option value="builtin">{$i18n.t('Built-in')}</option>
										<option value="external">{$i18n.t('External')}</option>
										<option value="disabled">{$i18n.t('Disabled')}</option>
									</select>
								</div>
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Citations')}</div>
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={openclawConfig.memory.citations}
									>
										<option value="auto">{$i18n.t('Auto')}</option>
										<option value="on">{$i18n.t('On')}</option>
										<option value="off">{$i18n.t('Off')}</option>
									</select>
								</div>
							</div>
						</div>

						<!-- sandbox -->
						<div class="my-4">
							<div class="flex w-full justify-between mb-0.5">
								<div class="self-center text-xs font-medium text-gray-500">
									{$i18n.t('Sandbox')}
								</div>
							</div>
							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">
								sandbox.docker · sandbox.browser
							</div>
							<div class="text-xs text-gray-400 mb-1">{$i18n.t('Docker')}</div>
							<div class="flex gap-4">
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Image')}</div>
									<input
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										type="text"
										bind:value={openclawConfig.sandbox.docker.image}
										placeholder="openclaw/sandbox:latest"
									/>
								</div>

								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Sandbox Factory')}</div>
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={selectedSandboxId}
										on:change={() => {
											const sb = factorySandboxes.find((s) => s.id === selectedSandboxId);
											if (sb) {
												(openclawConfig as any).sandbox.docker.image =
													sb.image || (openclawConfig as any).sandbox.docker.image;
												toast.info($i18n.t('Linked Sandbox: ') + sb.name);
											}
										}}
									>
										<option value="">{$i18n.t('Select a factory sandbox')}</option>
										{#each factorySandboxes as sb}
											<option value={sb.id}>{sb.name}</option>
										{/each}
									</select>
								</div>
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Docker Memory')}</div>
									<input
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										type="text"
										bind:value={openclawConfig.sandbox.docker.memory}
										placeholder="4g"
									/>
								</div>
							</div>
							<div class="flex gap-4 mt-2">
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('CPUs')}</div>
									<input
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										type="text"
										bind:value={openclawConfig.sandbox.docker.cpus}
										placeholder="2"
									/>
								</div>
								<div class="flex-1">
									<div class="text-xs text-gray-400 mb-1">{$i18n.t('Network Mode')}</div>
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={openclawConfig.sandbox.docker.networkMode}
									>
										<option value="bridge">{$i18n.t('Bridge')}</option>
										<option value="host">{$i18n.t('Host')}</option>
										<option value="none">{$i18n.t('None')}</option>
									</select>
								</div>
							</div>
							<div class="mt-2">
								<div class="text-xs text-gray-400 mb-1">{$i18n.t('Browser')}</div>
								<div class="flex gap-4">
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={openclawConfig.sandbox.browser.enabled}
											class="rounded"
										/>
										<span class="text-xs">{$i18n.t('Enabled')}</span>
									</label>
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={openclawConfig.sandbox.browser.headless}
											class="rounded"
										/>
										<span class="text-xs">{$i18n.t('Headless')}</span>
									</label>
								</div>
								<div class="flex gap-4 mt-1">
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Width')}</div>
										<input
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											type="number"
											bind:value={openclawConfig.sandbox.browser.width}
										/>
									</div>
									<div class="flex-1">
										<div class="text-xs text-gray-400 mb-1">{$i18n.t('Height')}</div>
										<input
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											type="number"
											bind:value={openclawConfig.sandbox.browser.height}
										/>
									</div>
								</div>
							</div>

							<!-- sandbox module selection -->
							<div class="my-4">
								<div class="text-xs font-medium text-gray-500 mb-2">
									{$i18n.t('Sandbox Module')}
								</div>
								<div class="flex gap-2 mb-2">
									<button
										type="button"
										class="px-2 py-1 text-xs rounded-lg {sandboxSource === 'custom'
											? 'bg-black text-white'
											: 'bg-gray-100 dark:bg-gray-800'}"
										on:click={() => (sandboxSource = 'custom')}
									>
										{$i18n.t('Custom')}
									</button>
									<button
										type="button"
										class="px-2 py-1 text-xs rounded-lg {sandboxSource === 'factory'
											? 'bg-black text-white'
											: 'bg-gray-100 dark:bg-gray-800'}"
										on:click={() => (sandboxSource = 'factory')}
									>
										{$i18n.t('Factory Module')}
									</button>
								</div>

								{#if sandboxSource === 'factory'}
									<select
										class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
										bind:value={selectedSandboxId}
										on:change={() => {
											const sb = factorySandboxes.find((s) => s.id === selectedSandboxId);
											if (sb) {
												(openclawConfig as any).sandbox.docker.image = sb.image;
												(openclawConfig as any).sandbox.docker.memory = sb.memory;
												(openclawConfig as any).sandbox.docker.cpus = sb.cpus;
												(openclawConfig as any).sandbox.docker.networkMode = sb.network_mode;
											}
										}}
									>
										<option value="" disabled>{$i18n.t('Select a Sandbox')}</option>
										{#each factorySandboxes as sb}
											<option value={sb.id}>{sb.name}</option>
										{/each}
									</select>
								{:else}
									<div class="grid grid-cols-2 gap-4">
										<div class="flex-1">
											<div class="text-xs text-gray-400 mb-1">{$i18n.t('Image')}</div>
											<input
												class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
												type="text"
												bind:value={openclawConfig.sandbox.docker.image}
												placeholder="openclaw/sandbox:latest"
											/>
										</div>
										<div class="flex-1">
											<div class="text-xs text-gray-400 mb-1">{$i18n.t('Docker Memory')}</div>
											<input
												class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
												type="text"
												bind:value={openclawConfig.sandbox.docker.memory}
												placeholder="4g"
											/>
										</div>
									</div>
									<div class="flex gap-4 mt-2">
										<div class="flex-1">
											<div class="text-xs text-gray-400 mb-1">{$i18n.t('CPUs')}</div>
											<input
												class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
												type="text"
												bind:value={openclawConfig.sandbox.docker.cpus}
												placeholder="2"
											/>
										</div>
										<div class="flex-1">
											<div class="text-xs text-gray-400 mb-1">{$i18n.t('Network Mode')}</div>
											<select
												class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
												bind:value={openclawConfig.sandbox.docker.networkMode}
											>
												<option value="bridge">{$i18n.t('Bridge')}</option>
												<option value="host">{$i18n.t('Host')}</option>
												<option value="none">{$i18n.t('None')}</option>
											</select>
										</div>
									</div>
								{/if}
							</div>

							<!-- hooks -->
							<div class="my-4 border-t border-gray-100 dark:border-gray-800 pt-4">
								<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">hooks.list</div>
								<div class="flex w-full justify-between mb-1">
									<div class="self-center text-xs font-medium text-gray-500">
										{$i18n.t('Hooks')}
									</div>
									<div class="flex gap-2">
										<button
											class="px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
											type="button"
											on:click={() => {
												hooksSource = 'factory';
											}}
										>
											{$i18n.t('Import Factory')}
										</button>
										<button
											class="px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
											type="button"
											on:click={() => {
												openclawConfig.hooks.list = [
													...openclawConfig.hooks.list,
													{ event: '', action: '', enabled: true }
												];
											}}
										>
											+ {$i18n.t('Add Hook')}
										</button>
									</div>
								</div>

								{#if hooksSource === 'factory'}
									<div
										class="mb-4 p-2 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-100 dark:border-gray-800"
									>
										<div class="text-[10px] uppercase font-bold text-gray-400 mb-2">
											{$i18n.t('Select Factory Hook to Add')}
										</div>
										<select
											class="w-full text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1 mb-2"
											bind:value={selectedHookId}
											on:change={() => {
												const hook = factoryHooks.find((h) => h.id === selectedHookId);
												if (hook) {
													openclawConfig.hooks.list = [
														...openclawConfig.hooks.list,
														{
															event: (hook.event as string) || '',
															action: (hook.action as string) || '',
															enabled: true
														}
													];
													toast.success($i18n.t('Hook added: ') + hook.name);
													hooksSource = 'custom';
													selectedHookId = '';
												}
											}}
										>
											<option value="" disabled>{$i18n.t('Select a factory hook')}</option>
											{#each factoryHooks as hook}
												<option value={hook.id}>{hook.name} ({hook.event})</option>
											{/each}
										</select>
										<button
											class="text-[10px] text-gray-500 hover:text-black dark:hover:text-white underline"
											on:click={() => (hooksSource = 'custom')}>{$i18n.t('Cancel')}</button
										>
									</div>
								{/if}

								{#each openclawConfig.hooks.list as hook, hookIdx}
									<div class="flex gap-2 items-center mb-1">
										<input
											class="w-24 text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											type="text"
											bind:value={hook.event}
											placeholder={$i18n.t('Event')}
										/>
										<input
											class="flex-1 text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
											type="text"
											bind:value={hook.action}
											placeholder={$i18n.t('Action')}
										/>
										<label class="flex items-center gap-1">
											<input type="checkbox" bind:checked={hook.enabled} class="rounded" />
										</label>
										<button
											class="text-xs text-red-400 hover:text-red-600 transition"
											type="button"
											on:click={() => {
												openclawConfig.hooks.list = openclawConfig.hooks.list.filter(
													(_: any, i: number) => i !== hookIdx
												);
											}}>✕</button
										>
									</div>
								{/each}
								{#if openclawConfig.hooks.list.length === 0}
									<div class="text-xs text-gray-400">{$i18n.t('No hooks configured')}</div>
								{/if}
							</div>

							{#if (($functions as unknown as Array<{ id: string; type: string; is_global?: boolean; meta?: { toggle?: boolean } }>) || []).filter((func) => func.type === 'filter').length > 0 || (($functions as unknown as Array<{ id: string; type: string; is_global?: boolean; meta?: { toggle?: boolean } }>) || []).filter((func) => func.type === 'action').length > 0}
								<hr class=" border-gray-100/30 dark:border-gray-850/30 my-4" />

								{#if (($functions as unknown as Array<{ id: string; type: string; is_global?: boolean; meta?: { toggle?: boolean } }>) || []).filter((func) => func.type === 'filter').length > 0}
									<div class="my-4">
										<FiltersSelector
											bind:selectedFilterIds={filterIds}
											filters={(($functions as unknown as any[]) || []).filter(
												(func) => (func as any).type === 'filter'
											)}
										/>
									</div>

									{@const toggleableFilters = (
										($functions as unknown as Array<{
											id: string;
											type: string;
											is_global?: boolean;
											meta?: { toggle?: boolean };
										}>) || []
									).filter(
										(func) =>
											func.type === 'filter' &&
											(filterIds.includes(func.id) || func?.is_global) &&
											func?.meta?.toggle
									)}

									{#if toggleableFilters.length > 0}
										<div class="my-4">
											<DefaultFiltersSelector
												bind:selectedFilterIds={defaultFilterIds}
												filters={toggleableFilters}
											/>
										</div>
									{/if}
								{/if}

								{#if (($functions as unknown as Array<{ id: string; type: string; is_global?: boolean; meta?: { toggle?: boolean } }>) || []).filter((func) => func.type === 'action').length > 0}
									<div class="my-4">
										<ActionsSelector
											bind:selectedActionIds={actionIds}
											actions={(($functions as unknown as any[]) || []).filter(
												(func) => (func as any).type === 'action'
											)}
										/>
									</div>
								{/if}
							{/if}

							<hr class=" border-gray-100/30 dark:border-gray-850/30 my-4" />

							<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
								meta.capabilities · meta.defaultFeatureIds · meta.builtinTools (Models API)
							</div>
							<div class="my-4">
								<Capabilities bind:capabilities />
							</div>

							{#if Object.keys(capabilities as unknown as Record<string, boolean>).filter((key: string) => (capabilities as unknown as Record<string, boolean>)[key]).length > 0}
								{@const availableFeatures = Object.entries(
									capabilities as unknown as Record<string, boolean>
								)
									.filter(
										([key, value]) =>
											value && ['web_search', 'code_interpreter', 'image_generation'].includes(key)
									)
									.map(([key]) => key)}

								{#if availableFeatures.length > 0}
									<div class="my-4">
										<DefaultFeatures {availableFeatures} bind:featureIds={defaultFeatureIds} />
									</div>
								{/if}
							{/if}

							{#if (capabilities as any).builtin_tools}
								<div class="my-4">
									<BuiltinTools bind:builtinTools={builtinTools as any} />
								</div>
							{/if}

							<div class="my-4">
								<div class="flex w-full justify-between mb-1">
									<div class="self-center text-xs font-medium text-gray-500">
										{$i18n.t('TTS Voice')}
									</div>
								</div>
								<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1">
									meta.tts.voice (Models API only)
								</div>
								<input
									class="w-full text-sm bg-transparent outline-hidden"
									type="text"
									bind:value={tts.voice}
									placeholder={$i18n.t('e.g. alloy, echo, shimmer')}
								/>
							</div>

							<!-- Sections above already edit agents/tools/gateway/memory/hooks; only orchestration + channels + pipelines need full editors here -->
							<hr class=" border-gray-100/30 dark:border-gray-850/30 my-4" />

							<div class="my-4 space-y-2">
								<div class="text-xs font-medium text-gray-500 mb-1">
									{$i18n.t('OpenClaw engine (advanced)')}
								</div>
								<div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-2">
									orchestration.* (full tree) · channels.* · pipelines.*
								</div>

								<div class="rounded-lg border border-gray-200 dark:border-gray-700">
									<button
										type="button"
										class="w-full flex items-center justify-between text-left text-xs font-medium text-gray-600 dark:text-gray-400 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/80"
										on:click={() => (panelOrchestrationOpen = !panelOrchestrationOpen)}
									>
										<span>{$i18n.t('Orchestration')}</span>
										<span class="text-gray-400">{panelOrchestrationOpen ? '▼' : '▶'}</span>
									</button>
									{#if panelOrchestrationOpen}
										<div class="px-2 pb-3 border-t border-gray-100 dark:border-gray-800">
											<OrchestrationConfig
												bind:config={openclawConfig.orchestration}
												on:change={handleOpenClawChange}
											/>
										</div>
									{/if}
								</div>

								<div class="rounded-lg border border-gray-200 dark:border-gray-700">
									<button
										type="button"
										class="w-full flex items-center justify-between text-left text-xs font-medium text-gray-600 dark:text-gray-400 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/80"
										on:click={() => (panelChannelsOpen = !panelChannelsOpen)}
									>
										<span>{$i18n.t('Channels')}</span>
										<span class="text-gray-400">{panelChannelsOpen ? '▼' : '▶'}</span>
									</button>
									{#if panelChannelsOpen}
										<div class="px-2 pb-3 border-t border-gray-100 dark:border-gray-800">
											<ChannelsConfig
												bind:config={openclawConfig.channels}
												on:change={handleOpenClawChange}
											/>
										</div>
									{/if}
								</div>

								<div class="rounded-lg border border-gray-200 dark:border-gray-700">
									<button
										type="button"
										class="w-full flex items-center justify-between text-left text-xs font-medium text-gray-600 dark:text-gray-400 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/80"
										on:click={() => (panelPipelinesOpen = !panelPipelinesOpen)}
									>
										<span>{$i18n.t('Pipelines')}</span>
										<span class="text-gray-400">{panelPipelinesOpen ? '▼' : '▶'}</span>
									</button>
									{#if panelPipelinesOpen}
										<div class="px-2 pb-3 border-t border-gray-100 dark:border-gray-800">
											<PipelinesConfig
												bind:config={openclawConfig.pipelines}
												on:change={handleOpenClawChange}
											/>
										</div>
									{/if}
								</div>
							</div>

								<!-- Observability Audit Timeline -->
								<div class="rounded-lg border border-gray-200 dark:border-gray-700 mb-2">
									<button
										type="button"
										class="w-full flex items-center justify-between text-left text-xs font-medium text-gray-600 dark:text-gray-400 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/80"
										on:click={() => (panelAuditOpen = !panelAuditOpen)}
									>
										<span>{$i18n.t('Audit Timeline')}</span>
										<span class="text-gray-400">{panelAuditOpen ? '▼' : '▶'}</span>
									</button>
									{#if panelAuditOpen}
									<div class="mt-0 p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 rounded-b-lg">
										<div class="flex flex-wrap gap-2 items-end">
											<div>
												<div class="text-xs text-gray-400 mb-1">{$i18n.t('Event')}</div>
												<input
													class="text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
													type="text"
													placeholder="openclaw.guardrail"
													bind:value={openClawAuditEventFilter}
												/>
											</div>
											<div>
												<div class="text-xs text-gray-400 mb-1">{$i18n.t('Action')}</div>
												<input
													class="text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
													type="text"
													placeholder="blocked"
													bind:value={openClawAuditActionFilter}
												/>
											</div>
											<div>
												<div class="text-xs text-gray-400 mb-1">{$i18n.t('Limit')}</div>
												<input
													class="w-24 text-sm bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
													type="number"
													min="1"
													max="1000"
													bind:value={openClawAuditLimit}
												/>
											</div>
											<button
												class="px-3 py-1.5 text-xs rounded bg-black text-white dark:bg-white dark:text-black"
												type="button"
												on:click={fetchOpenClawAuditEvents}
												disabled={openClawAuditLoading}
											>
												{openClawAuditLoading ? $i18n.t('Loading...') : $i18n.t('Refresh')}
											</button>
											<button
												class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600"
												type="button"
												on:click={exportAuditEvents}
												disabled={openClawAuditEvents.length === 0}
											>
												{$i18n.t('Export JSON')}
											</button>
										</div>
										<div class="mt-2 flex flex-wrap gap-2 items-center">
											<label class="text-xs flex items-center gap-2">
												<input type="checkbox" bind:checked={openClawAuditAutoRefresh} />
												<span>{$i18n.t('Auto-refresh')}</span>
											</label>
											<input
												class="w-16 text-xs bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-0.5"
												type="number"
												min="2"
												max="60"
												bind:value={openClawAuditAutoRefreshSec}
											/>
											<span class="text-xs text-gray-400">sec</span>
										</div>
										<div class="mt-2">
											<div class="text-xs text-gray-400 mb-1">{$i18n.t('Quick Event Filters')}</div>
											<div class="flex flex-wrap gap-1">
												{#each AUDIT_EVENT_QUICK_FILTERS as evFilter}
													<button
														class="px-2 py-1 text-[11px] rounded border {openClawAuditEventFilter === evFilter
															? 'bg-black text-white dark:bg-white dark:text-black'
															: 'border-gray-300 dark:border-gray-600'}"
														type="button"
														on:click={() => selectAuditQuickEvent(evFilter)}
													>
														{evFilter || $i18n.t('All')}
													</button>
												{/each}
											</div>
										</div>
										<div class="mt-2">
											<div class="text-xs text-gray-400 mb-1">{$i18n.t('Quick Action Filters')}</div>
											<div class="flex flex-wrap gap-1">
												{#each AUDIT_ACTION_QUICK_FILTERS as actionFilter}
													<button
														class="px-2 py-1 text-[11px] rounded border {openClawAuditActionFilter === actionFilter
															? 'bg-black text-white dark:bg-white dark:text-black'
															: 'border-gray-300 dark:border-gray-600'}"
														type="button"
														on:click={() => selectAuditQuickAction(actionFilter)}
													>
														{actionFilter || $i18n.t('All')}
													</button>
												{/each}
											</div>
										</div>
										<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
											{$i18n.t('Matched')}: {openClawAuditTotalMatched} | {$i18n.t('Shown')}:
											{openClawAuditEvents.length}
										</div>
										<div class="mt-2 max-h-56 overflow-auto rounded border border-gray-200 dark:border-gray-700">
											{#if openClawAuditEvents.length === 0}
												<div class="p-3 text-xs text-gray-400">{$i18n.t('No audit events')}</div>
											{:else}
												{#each openClawAuditEvents as ev}
													<button
														class="w-full text-left p-2 border-b border-gray-100 dark:border-gray-700/40 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/20"
														type="button"
														on:click={() => {
															selectedAuditEvent = ev;
														}}
													>
														<div class="font-medium text-gray-700 dark:text-gray-200">
															{String(ev.event ?? '-')}: {String(ev.action ?? '-')}
														</div>
														<div class="text-gray-500 dark:text-gray-400">
															{formatAuditTime(ev.at)}
														</div>
													</button>
												{/each}
											{/if}
										</div>
										{#if selectedAuditEvent}
											<div class="mt-3">
												<div class="flex items-center justify-between mb-1">
													<div class="text-xs font-medium text-gray-500">{$i18n.t('Selected Event Details')}</div>
													<button
														class="text-xs px-2 py-1 border rounded border-gray-300 dark:border-gray-600"
														type="button"
														on:click={() => {
															selectedAuditEvent = null;
														}}
													>
														{$i18n.t('Close')}
													</button>
												</div>
												<textarea
													class="w-full text-xs bg-transparent outline-hidden border border-gray-200 dark:border-gray-700 rounded p-2"
													rows="8"
													readonly
													value={JSON.stringify(selectedAuditEvent, null, 2)}
												></textarea>
											</div>
										{/if}
									</div>
									{/if}
								</div>

								<!-- Config Lifecycle (Validate / Import / Export / Sync) -->
								<div class="rounded-lg border border-gray-200 dark:border-gray-700 mb-2">
									<button
										type="button"
										class="w-full flex items-center justify-between text-left text-xs font-medium text-gray-600 dark:text-gray-400 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/80"
										on:click={() => (panelLifecycleOpen = !panelLifecycleOpen)}
									>
										<span>{$i18n.t('Config Lifecycle')}</span>
										<span class="text-gray-400">{panelLifecycleOpen ? '▼' : '▶'}</span>
									</button>
									{#if panelLifecycleOpen}
									<div class="mt-0 p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 rounded-b-lg">
										<div class="flex flex-wrap gap-2">
											<button
												class="px-3 py-1.5 text-xs rounded bg-black text-white dark:bg-white dark:text-black"
												type="button"
												on:click={runOpenClawValidation}
												disabled={openClawConfigOpsLoading}
											>
												{$i18n.t('Validate')}
											</button>
											<button
												class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600"
												type="button"
												on:click={runOpenClawExport}
												disabled={openClawConfigOpsLoading}
											>
												{$i18n.t('Export Config')}
											</button>
											<select
												class="text-xs bg-transparent outline-hidden border-b border-gray-200 dark:border-gray-700 py-1"
												bind:value={openClawSyncDirection}
											>
												<option value="openclaw_to_db">openclaw_to_db</option>
												<option value="db_to_openclaw">db_to_openclaw</option>
											</select>
											<button
												class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600"
												type="button"
												on:click={runOpenClawModelSync}
												disabled={openClawConfigOpsLoading}
											>
												{$i18n.t('Sync Model')}
											</button>
										</div>

										<div class="mt-3">
											<div class="text-xs text-gray-400 mb-1">
												{$i18n.t('Import Payload (raw config or export envelope)')}
											</div>
											<textarea
												class="w-full text-xs bg-transparent outline-hidden border border-gray-200 dark:border-gray-700 rounded p-2"
												rows="5"
												bind:value={openClawImportPayload}
												placeholder={'{"config": {...}}'}
											></textarea>
											<label class="mt-2 text-xs flex items-center gap-2">
												<input type="checkbox" bind:checked={openClawImportDryRun} />
												<span>{$i18n.t('Dry-run only (no persist)')}</span>
											</label>
											<button
												class="mt-2 px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600"
												type="button"
												on:click={runOpenClawImport}
												disabled={openClawConfigOpsLoading}
											>
												{$i18n.t('Import Config')}
											</button>
											{#if openClawImportDiffSummary}
												<textarea
													class="mt-2 w-full text-xs bg-transparent outline-hidden border border-gray-200 dark:border-gray-700 rounded p-2"
													rows="4"
													readonly
													value={JSON.stringify(openClawImportDiffSummary, null, 2)}
												></textarea>
											{/if}
										</div>

										{#if openClawValidateResult}
											<div class="mt-3">
												<div class="text-xs font-medium text-gray-500 mb-1">
													{$i18n.t('Validation Result')}
												</div>
												<textarea
													class="w-full text-xs bg-transparent outline-hidden border border-gray-200 dark:border-gray-700 rounded p-2"
													rows="5"
													readonly
													value={JSON.stringify(openClawValidateResult, null, 2)}
												></textarea>
											</div>
										{/if}
									</div>
									{/if}
								</div>

							<hr class=" border-gray-100/30 dark:border-gray-850/30 my-4" />

							<div class="my-2 flex justify-end">
								<button
									class=" text-sm px-3 py-2 transition rounded-lg {loading
										? ' cursor-not-allowed bg-black hover:bg-gray-900 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black'
										: 'bg-black hover:bg-gray-900 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black'} flex w-full justify-center"
									type="submit"
									disabled={loading}
								>
									<div class=" self-center font-medium">
										{#if edit}
											{$i18n.t('Save & Update')}
										{:else}
											{$i18n.t('Save & Create')}
										{/if}
									</div>

									{#if loading}
										<div class="ml-1.5 self-center">
											<Spinner />
										</div>
									{/if}
								</button>
							</div>

							<div class="my-2 text-gray-300 dark:text-gray-700 pb-20">
								<div class="flex w-full justify-between mb-2">
									<div class=" self-center text-sm font-medium">{$i18n.t('JSON Preview')}</div>

									<button
										class="p-1 px-3 text-xs flex rounded-sm transition"
										type="button"
										on:click={() => {
											showPreview = !showPreview;
										}}
									>
										{#if showPreview}
											<span class="ml-2 self-center">{$i18n.t('Hide')}</span>
										{:else}
											<span class="ml-2 self-center">{$i18n.t('Show')}</span>
										{/if}
									</button>
								</div>

								{#if showPreview}
									<div>
										<textarea
											class="text-sm w-full bg-transparent outline-hidden resize-none"
											rows="10"
											value={JSON.stringify(info, null, 2)}
											disabled
											readonly
										></textarea>
									</div>
								{/if}
							</div>
						</div>
					
				</div>
			</form>
		{/if}
	</div>
	{/if}
{/if}

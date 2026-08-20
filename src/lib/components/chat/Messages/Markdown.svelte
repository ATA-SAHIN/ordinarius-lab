<script lang="ts">
	import { onDestroy } from 'svelte';
	import { marked } from 'marked';
	import { replaceTokens, processResponseContent } from '$lib/utils';
	import { user } from '$lib/stores';

	import markedExtension from '$lib/utils/marked/extension';
	import markedKatexExtension from '$lib/utils/marked/katex-extension';
	import { disableSingleTilde } from '$lib/utils/marked/strikethrough-extension';
	import { mentionExtension } from '$lib/utils/marked/mention-extension';

	import MarkdownTokens from './Markdown/MarkdownTokens.svelte';
	import footnoteExtension from '$lib/utils/marked/footnote-extension';
	import citationExtension from '$lib/utils/marked/citation-extension';
	import type { Model } from '$lib/types/models';

	export let id = '';
	export let content: string;
	export let done = true;
	export let model: Model | null = null;
	export let save = false;
	export let preview = false;

	export let paragraphTag = 'p';
	export let editCodeBlock = true;
	export let topPadding = false;

	export let sourceIds: string[] = [];

	export let onSave: (code: string) => void = () => {};
	export let onUpdate: (token: any) => void = () => {};

	export let onPreview: (code: string) => void = () => {};

	export let onSourceClick: (id: string) => void = () => {};
	export let onTaskClick: (id: string) => void = () => {};

	let tokens: any[] = [];
	let pendingUpdate: number | null = null;
	let lastContent = '';
	let lastParsedContent = '';

	const options = {
		throwOnError: false,
		breaks: true
	};

	marked.use(markedKatexExtension(options) as any);
	marked.use(markedExtension(options) as any);
	marked.use(citationExtension() as any);
	marked.use(footnoteExtension() as any);
	marked.use(disableSingleTilde as any);
	marked.use({
		extensions: [
			mentionExtension({ triggerChar: '@' }) as any,
			mentionExtension({ triggerChar: '#' }) as any,
			mentionExtension({ triggerChar: '$' }) as any
		]
	});

	const parseTokens = () => {
		if (content === lastContent) return;
		lastContent = content;

		const processed = replaceTokens(
			processResponseContent(content),
			model?.name ?? '',
			$user?.name ?? ''
		);
		if (processed === lastParsedContent) return;
		lastParsedContent = processed;

		tokens = marked.lexer(processed);
	};

	const updateHandler = (content: string) => {
		if (content) {
			if (done) {
				if (pendingUpdate) cancelAnimationFrame(pendingUpdate);
				pendingUpdate = null;
				parseTokens();
			} else if (!pendingUpdate) {
				pendingUpdate = requestAnimationFrame(() => {
					pendingUpdate = null;
					parseTokens();
				}) as unknown as number;
			}
		}
	};

	$: updateHandler(content);

	// Throttle parsing to once per animation frame while streaming
	$: onDestroy(() => {
		if (pendingUpdate) cancelAnimationFrame(pendingUpdate);
	});
</script>

{#key id}
	<MarkdownTokens
		{tokens}
		{id}
		{done}
		{save}
		{preview}
		{paragraphTag}
		{editCodeBlock}
		{sourceIds}
		{topPadding}
		{onTaskClick}
		{onSourceClick}
		{onSave}
		{onUpdate}
		{onPreview}
	/>
{/key}

<script lang="ts">
	import { toast } from 'svelte-sonner';

	import { tick, getContext, onMount, createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	const i18n = getContext('i18n');

	import { settings } from '$lib/stores';
	import { copyToClipboard } from '$lib/utils';
	import type { ChatHistory, ChatMessage } from '$lib/types/chat';
	import type { User } from '$lib/types';

	import MultiResponseMessages from './MultiResponseMessages.svelte';
	import ResponseMessage from './ResponseMessage.svelte';
	import UserMessage from './UserMessage.svelte';

	export let chatId: string;
	export let selectedModels: string[] = [];
	export let idx: number = 0;

	export let history: ChatHistory;
	export let messageId: string;

	export let user: User;

	export let setInputText: (text: string) => void = () => {};
	export let gotoMessage: (message: ChatMessage, index?: number) => void;
	export let showPreviousMessage: (message: ChatMessage) => void;
	export let showNextMessage: (message: ChatMessage) => void;
	export let updateChat: () => void;

	export let editMessage: (
		id: string,
		data: { content: string; files?: any[] },
		submit?: boolean
	) => void;
	export let saveMessage: (id: string, message: any) => void;
	export let deleteMessage: (id: string) => void;
	export let rateMessage: (id: string, rating: number) => void;
	export let actionMessage: (id: string, message: ChatMessage) => void;
	export let submitMessage: (parentId: string, content: string) => void;

	export let regenerateResponse: (message: ChatMessage | null, prompt?: string | null) => void;
	export let continueResponse: (message: ChatMessage) => void;
	export let mergeResponses: (id: string) => void;

	export let addMessages: (data: {
		modelId: string;
		parentId: string;
		messages: ChatMessage[];
	}) => void;
	export let triggerScroll: () => void = () => {};
	export let readOnly: boolean = false;
	export let editCodeBlock: boolean = true;
	export let topPadding: boolean = false;
</script>

<div
	role="listitem"
	class="flex flex-col justify-between px-5 mb-3 w-full {($settings?.widescreenMode ?? null)
		? 'max-w-full'
		: 'max-w-5xl'} mx-auto rounded-lg group"
>
	{#if history.messages && messageId && history.messages[messageId]}
		{#if history.messages[messageId].role === 'user'}
			<UserMessage
				{user}
				{chatId}
				{history}
				{messageId}
				isFirstMessage={idx === 0}
				siblings={history.messages[messageId].parentId !== null &&
				history.messages[messageId].parentId !== undefined
					? (history.messages[history.messages[messageId].parentId as string]?.childrenIds ?? [])
					: (Object.values(history.messages)
							.filter((m) => m.parentId === null || m.parentId === undefined)
							.map((m) => m.id) as string[])}
				{gotoMessage}
				{showPreviousMessage}
				{showNextMessage}
				{editMessage}
				{deleteMessage}
				{readOnly}
				{editCodeBlock}
				{topPadding}
			/>
		{:else if history.messages[messageId].parentId !== null && history.messages[messageId].parentId !== undefined && (history.messages[history.messages[messageId].parentId as string]?.models?.length ?? 1) === 1}
			<ResponseMessage
				{chatId}
				{history}
				{messageId}
				{selectedModels}
				isLastMessage={messageId === history.currentId}
				siblings={history.messages[history.messages[messageId].parentId as string]?.childrenIds ??
					[]}
				{setInputText}
				{gotoMessage}
				{showPreviousMessage}
				{showNextMessage}
				{updateChat}
				{editMessage}
				{saveMessage}
				{rateMessage}
				{actionMessage}
				{submitMessage}
				{deleteMessage}
				{continueResponse}
				{regenerateResponse}
				{addMessages}
				{readOnly}
				{editCodeBlock}
				{topPadding}
			/>
		{:else}
			{#key messageId}
				<MultiResponseMessages
					bind:history
					{chatId}
					{messageId}
					{selectedModels}
					isLastMessage={messageId === history?.currentId}
					{setInputText}
					{updateChat}
					{editMessage}
					{saveMessage}
					{rateMessage}
					{actionMessage}
					{submitMessage}
					{deleteMessage}
					{continueResponse}
					{regenerateResponse}
					{mergeResponses}
					{triggerScroll}
					{addMessages}
					{readOnly}
					{editCodeBlock}
					{topPadding}
				/>
			{/key}
		{/if}
	{/if}
</div>

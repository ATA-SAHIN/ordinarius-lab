import { APP_NAME } from '$lib/constants';
import { type Writable, writable } from 'svelte/store';
import type { ModelConfig } from '$lib/apis';
import type {
	Banner,
	Config,
	SessionUser,
	Settings,
	Model,
	Document,
	OllamaModel,
	OpenAIModel,
	OllamaModelDetails,
	ModelOptions,
	AudioSettings,
	TitleSettings,
	PromptSuggestion,
	Tag,
	ChatFolder,
	ChatListItem,
	Channel,
	Function,
	Skill,
	Tool
} from '$lib/types';
import type { Socket } from 'socket.io-client';
import type { AudioQueue } from '$lib/utils/audio';
import type { KokoroWorker } from '$lib/workers/KokoroWorker';
export type { SessionUser } from '$lib/types';

import emojiShortCodes from '$lib/emoji-shortcodes.json';

// Backend
export const WEBUI_NAME = writable(APP_NAME);

export const WEBUI_VERSION: Writable<string | null> = writable(null);
export const WEBUI_DEPLOYMENT_ID: Writable<string | null> = writable(null);

export const config: Writable<Config | undefined> = writable(undefined);
export const user: Writable<SessionUser | undefined> = writable(undefined);

// Electron App
export const isApp = writable(false);
export const appInfo: Writable<any> = writable(null);
export const appData: Writable<any> = writable(null);

// Frontend
export const MODEL_DOWNLOAD_POOL = writable({});

export const mobile = writable(false);

export const socket: Writable<null | Socket> = writable(null);
export const activeUserIds: Writable<null | string[]> = writable(null);
export const activeChatIds: Writable<Set<string>> = writable(new Set());
export const USAGE_POOL: Writable<null | string[]> = writable(null);

export const theme = writable('system');

export const shortCodesToEmojis = writable(
	Object.entries(emojiShortCodes).reduce((acc: Record<string, string>, [key, value]) => {
		if (typeof value === 'string') {
			acc[value] = key;
		} else {
			for (const v of value) {
				acc[v] = key;
			}
		}

		return acc;
	}, {} as Record<string, string>)
);

export const TTSWorker: Writable<KokoroWorker | null> = writable(null);

export const chatId: Writable<string> = writable('');
export const chatTitle: Writable<string> = writable('');

export const channels: Writable<Channel[]> = writable([]);
export const channelId: Writable<string | null> = writable(null);

export const chats: Writable<ChatListItem[] | null> = writable(null);
export const pinnedChats: Writable<ChatListItem[]> = writable([]);
export const tags: Writable<Tag[]> = writable([]);
export const folders: Writable<ChatFolder[]> = writable([]);

export const selectedFolder = writable(null);

export const models: Writable<Model[]> = writable([]);

export const knowledge: Writable<null | Document[]> = writable(null);
export const tools: Writable<Tool[] | null> = writable(null);
export const skills: Writable<Skill[] | null> = writable(null);
export const functions: Writable<Function[] | null> = writable(null);

export const toolServers: Writable<any[]> = writable([]);
export const terminalServers: Writable<any[]> = writable([]);

// Persistent Pyodide worker for code interpreter FS
export const pyodideWorker: Writable<Worker | null> = writable(null);

export const banners: Writable<Banner[]> = writable([]);

export const settings: Writable<Settings> = writable({});

export const audioQueue = writable<AudioQueue | null>(null);

export const sidebarWidth = writable(260);

export const showSidebar = writable(false);
export const showSearch = writable(false);
export const showSettings = writable(false);
export const showShortcuts = writable(false);
export const showArchivedChats = writable(false);
export const showChangelog = writable(false);

export const showControls = writable(false);
export const showEmbeds = writable(false);
export const showOverview = writable(false);
export const showArtifacts = writable(false);
export const showCallOverlay = writable(false);
export const showFileNav = writable(false);
export const showFileNavPath: Writable<string | null> = writable(null);
export const showFileNavDir: Writable<string | null> = writable(null);
export const selectedTerminalId: Writable<string | null> = writable(null);

export const artifactCode: Writable<string | null> = writable(null);
export const artifactContents: Writable<any | null> = writable(null);

export const embed = writable(null);

export const temporaryChatEnabled = writable(false);
export const scrollPaginationEnabled = writable(false);
export const currentChatPage = writable(1);

export const isLastActiveTab = writable(true);
export const playingNotificationSound = writable(false);

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { i18n as i18nType } from 'i18next';
import type { Writable } from 'svelte/store';

declare global {
	const APP_VERSION: string;
	const APP_BUILD_HASH: string;
	const gapi: any;
	const google: any;
	type dict = Record<string, unknown>;
	type TippyInstance = any;

	interface Navigator {
		gpu?: unknown;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}

	// Global i18n store type for getContext('i18n')
	type I18nStore = Writable<i18nType>;
}

// Augment svelte module to type getContext('i18n')
declare module 'svelte' {
	export function getContext(key: 'i18n'): I18nStore;
}

export {};

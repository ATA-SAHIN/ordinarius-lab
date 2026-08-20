/**
 * Type Definitions Index
 * 
 * Central export point for all type definitions in the application.
 * Import types from this file for consistency and ease of use.
 * 
 * @example
 * ```typescript
 * import type { ChatMessage, Note, Permission } from '$lib/types';
 * ```
 * 
 * @module types
 */

// ============================================================================
// Legacy Types (kept for backwards compatibility)
// ============================================================================

export type Banner = {
	id: string;
	type: string;
	title?: string;
	content: string;
	url?: string;
	dismissible?: boolean;
	timestamp: number;
};

export enum TTS_RESPONSE_SPLIT {
	PUNCTUATION = 'punctuation',
	PARAGRAPHS = 'paragraphs',
	NONE = 'none'
}

// ============================================================================
// Core Type Modules
// ============================================================================

/**
 * Common utility types and primitives
 */
export * from './common';

/**
 * Event handler types for DOM and custom events
 */
export * from './events';

/**
 * Chat and messaging types
 */
export * from './chat';

/**
 * Notes and documents types
 */
export * from './notes';

/**
 * Permissions and access control types
 */
export * from './permissions';

/**
 * API request/response types
 */
export * from './api';

/**
 * Model configuration and capability types
 */
export * from './models';

/**
 * Svelte store types
 */
export * from './stores';

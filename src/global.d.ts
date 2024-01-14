/// <reference types="@sveltejs/kit" />
declare module "sveltestrap";

declare type DndEvent = import("svelte-dnd-action").DndEvent;
declare namespace svelte.JSX {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLAttributes<T> {
        onconsider?: (event: CustomEvent<DndEvent> & {target: EventTarget & T}) => void;
        onfinalize?: (event: CustomEvent<DndEvent> & {target: EventTarget & T}) => void;
    }
}

// No TS Definitions for this module
declare module 'svelte-tags-input';
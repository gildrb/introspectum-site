import { useSyncExternalStore } from "preact/compat";

/** Nothing to listen to: whether the island is hydrated changes once, right after hydration. */
const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * Whether the island has been hydrated: false on the server and during hydration, so the first
 * render matches the served markup; true from the render right after, before the browser paints.
 * Layout effects declared before it see the served markup still in place.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, onClient, onServer);
}

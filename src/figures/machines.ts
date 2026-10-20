import type { Machine } from "./live.ts";

/**
 * Every drawn machine's motion, by name, each loaded on its own: a page downloads the code of the
 * machines it has and no other, so the imports are dynamic. `machine.tsx` holds their drawings
 * under the same names.
 */
export const machines = {
  bookwheel: async () => (await import("./bookwheel.ts")).bookwheel,
  ledger: async () => (await import("./ledger.ts")).ledger,
  mint: async () => (await import("./mint.ts")).mint,
  pantograph: async () => (await import("./pantograph.ts")).pantograph,
  proof: async () => (await import("./proof.ts")).proof,
  recorder: async () => (await import("./recorder.ts")).recorder,
  trace: async () => (await import("./trace.ts")).trace,
} satisfies Record<string, () => Promise<Machine>>;

export type MachineName = keyof typeof machines;

export function isMachineName(value: string | undefined): value is MachineName {
  return value !== undefined && Object.hasOwn(machines, value);
}

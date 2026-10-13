import { balance } from "./balance.ts";
import { ledger } from "./ledger.ts";
import type { Machine } from "./live.ts";
import { mint } from "./mint.ts";
import { pantograph } from "./pantograph.ts";
import { recorder } from "./recorder.ts";

/** Every drawn machine's motion, by name; `machine.tsx` holds their drawings under the same names. */
export const machines = { balance, ledger, mint, pantograph, recorder } satisfies Record<
  string,
  Machine
>;

export type MachineName = keyof typeof machines;

export function isMachineName(value: string | undefined): value is MachineName {
  return value !== undefined && Object.hasOwn(machines, value);
}

import { bookwheel } from "./bookwheel.ts";
import { ledger } from "./ledger.ts";
import type { Machine } from "./live.ts";
import { mint } from "./mint.ts";
import { pantograph } from "./pantograph.ts";
import { proof } from "./proof.ts";
import { recorder } from "./recorder.ts";
import { trace } from "./trace.ts";

/** Every drawn machine's motion, by name; `machine.tsx` holds their drawings under the same names. */
export const machines = {
  bookwheel,
  ledger,
  mint,
  pantograph,
  proof,
  recorder,
  trace,
} satisfies Record<string, Machine>;

export type MachineName = keyof typeof machines;

export function isMachineName(value: string | undefined): value is MachineName {
  return value !== undefined && Object.hasOwn(machines, value);
}

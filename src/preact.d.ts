import type { Signalish } from "preact";

/**
 * `spellCheck`, React's name for the `spellcheck` attribute. Preact types only the lowercase
 * name but writes either to the page as given, & HTML reads attribute names in any case. A
 * string, since Preact leaves out an attribute set to `false`.
 */
declare module "preact" {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- merging needs an interface
  interface HTMLAttributes<RefType extends EventTarget = EventTarget> {
    spellCheck?: Signalish<"true" | "false" | undefined>;
  }
}

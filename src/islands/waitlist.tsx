import * as Checkbox from "@radix-ui/react-checkbox";
import * as stylex from "@stylexjs/stylex";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { useHydrated } from "./hydrated.ts";
import { isLocale, type Locale } from "../locale.ts";
import { isProductSlug, type ProductSlug } from "../site.ts";
import { colors, fontFeatures, leading, media, space, stroke } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";

/** The form's words, translated on the server so the browser loads no message catalog. */
const textKeys = [
  "email",
  "company",
  "honeypot",
  "consent",
  "submit",
  "sending",
  "joined",
  "failedConnection",
  "failedServer",
] as const;

export type WaitlistProps = {
  product: ProductSlug;
  locale: Locale;
  /** `consent` is the sentence the person agrees to; the Worker stores the same one. */
  text: Readonly<Record<(typeof textKeys)[number], string>>;
};

export function isWaitlistProps(value: unknown): value is WaitlistProps {
  if (typeof value !== "object" || value === null) return false;
  if (!("product" in value) || typeof value.product !== "string" || !isProductSlug(value.product))
    return false;
  if (!("locale" in value) || typeof value.locale !== "string" || !isLocale(value.locale))
    return false;
  if (!("text" in value) || typeof value.text !== "object" || value.text === null) return false;
  const { text } = value;
  return textKeys.every((key) => key in text && typeof Reflect.get(text, key) === "string");
}

type State = { $: "idle" } | { $: "sending" } | { $: "joined" } | { $: "failed"; reason: string };

/**
 * A product's waiting-list form. Without JavaScript it posts to `/api/waitlist`, which redirects to
 * the confirmation page, and its consent box is the browser's own; hydrated, the box is Radix's,
 * the same size & look, and the form posts in the background and answers in place.
 */
export function Waitlist({ product, locale, text }: WaitlistProps) {
  const [state, setState] = useState<State>({ $: "idle" });
  const [consent, setConsent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const box = useRef<HTMLButtonElement>(null);

  // On hydration, while the browser's checkbox is still in place: keep a tick given before it.
  useLayoutEffect(() => {
    const given = formRef.current?.elements.namedItem("consent");
    if (given instanceof HTMLInputElement) setConsent(given.checked);
  }, []);
  // The browser's checkbox until hydration, so the first render matches the server's; Radix's
  // after. After the effect above, so it reads the browser's box before it changes.
  const hydrated = useHydrated();

  async function submit(form: HTMLFormElement) {
    setState({ $: "sending" });
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    }).catch(() => null);
    if (response === null) {
      setState({ $: "failed", reason: text.failedConnection });
      return;
    }
    if (response.ok) {
      setState({ $: "joined" });
      return;
    }
    // A rejected sign-up explains itself in the visitor's language; anything else is our fault.
    const problem: unknown = await response.json().catch(() => null);
    const detail =
      typeof problem === "object" &&
      problem !== null &&
      "detail" in problem &&
      typeof problem.detail === "string"
        ? problem.detail
        : text.failedServer;
    setState({ $: "failed", reason: detail });
  }

  let status: string;
  switch (state.$) {
    case "idle":
    case "sending":
      status = "";
      break;
    case "joined":
      status = text.joined;
      break;
    case "failed":
      status = state.reason;
      break;
    default: {
      const _: never = state;
      return _;
    }
  }

  return (
    <div {...stylex.props(styles.waitlist)}>
      {state.$ !== "joined" && (
        <form
          ref={formRef}
          {...stylex.props(styles.form)}
          method="post"
          action="/api/waitlist"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(event.currentTarget);
          }}
        >
          <input type="hidden" name="product" value={product} />
          <input type="hidden" name="locale" value={locale} />
          <div {...stylex.props(styles.fields)}>
            <label {...stylex.props(ui.text, styles.field)}>
              <span {...stylex.props(ui.label)}>{text.email}</span>
              <input
                {...stylex.props(ui.text, styles.input)}
                type="email"
                name="email"
                required
                maxLength={254}
                autoComplete="email"
                spellCheck="false"
              />
            </label>
            <label {...stylex.props(ui.text, styles.field)}>
              <span {...stylex.props(ui.label)}>{text.company}</span>
              <input
                {...stylex.props(ui.text, styles.input)}
                type="text"
                name="company"
                maxLength={200}
                autoComplete="organization"
                spellCheck="false"
              />
            </label>
          </div>
          {/* Left empty by people, filled by bots; the server turns away any entry that has it. */}
          <div {...stylex.props(ui.srOnly)} aria-hidden="true">
            <label>
              {text.honeypot}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label {...stylex.props(ui.text, styles.consent)}>
            <span {...stylex.props(styles.box)}>
              {hydrated && (
                <Checkbox.Root
                  {...stylex.props(ui.focusRing, styles.checkbox, consent && styles.checked)}
                  ref={box}
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                />
              )}
              {hydrated ? (
                // The form's own box, under Radix's: it posts the tick & checks one was given. The
                // browser's message then points at the box, & the focus it gives passes on.
                <input
                  {...stylex.props(styles.unseen)}
                  type="checkbox"
                  name="consent"
                  value="yes"
                  required
                  checked={consent}
                  tabIndex={-1}
                  aria-hidden="true"
                  onFocus={() => box.current?.focus()}
                />
              ) : (
                // Uncontrolled, so a tick given before hydration survives it (see above).
                <input
                  {...stylex.props(ui.focusRing, styles.checkbox, styles.native)}
                  type="checkbox"
                  name="consent"
                  value="yes"
                  required
                />
              )}
            </span>
            <span {...stylex.props(ui.label)}>{text.consent}</span>
          </label>
          <button
            {...stylex.props(ui.reset, ui.button, ui.primary, ui.focusRing, styles.button)}
            type="submit"
            disabled={state.$ === "sending"}
          >
            {state.$ === "sending" ? text.sending : text.submit}
          </button>
        </form>
      )}
      <p
        {...stylex.props(state.$ === "joined" ? ui.prose : [ui.text, styles.failed])}
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
    </div>
  );
}

/**
 * The tick, drawn in cream (`colors.primary` dark, as light as `colors.bg` light): an image cannot
 * read the page's colors, and cream reads on emerald in both schemes.
 */
const tick = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 8.5l2.5 2.5 5.5-6' fill='none' stroke='%23fbf4e4' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

const styles = stylex.create({
  waitlist: { display: "flex", flexDirection: "column" },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: space.x2,
  },
  fields: {
    display: "grid",
    gridTemplateColumns: { default: "1fr 1fr", [media.mobile]: "1fr" },
    gap: space.x2,
    width: "100%",
  },
  field: { display: "flex", flexDirection: "column", rowGap: space.x1, minWidth: 0 },
  input: {
    width: "100%",
    // Controls: five units tall, six on phones for a finger.
    height: { default: space.x5, [media.mobile]: space.x6 },
    paddingInline: space.x2,
    borderWidth: stroke.width,
    borderStyle: "solid",
    borderColor: { default: colors.tertiary, ":focus": colors.primary },
    borderRadius: space.x1,
    boxShadow: { default: null, ":focus": `0 0 0 ${stroke.width} ${colors.primary}` },
    outline: "none",
    backgroundColor: "transparent",
    color: colors.primary,
    fontFamily: "inherit",
    // Addresses and company names are written in lowercase as much as capitals.
    fontFeatureSettings: fontFeatures.prose,
  },
  consent: {
    display: "flex",
    alignItems: "flex-start",
    columnGap: space.x1,
    cursor: "pointer",
  },
  /** Holds the box, centred on the first line of the sentence beside it. */
  box: {
    position: "relative",
    display: "flex",
    flexShrink: 0,
    marginTop: `calc((${leading.x3} - ${space.x2}) / 2)`,
  },
  /**
   * Two units square, edged like the fields; ticked, filled with emerald & checked in cream. The
   * browser's box & Radix's look the same, so hydration swaps one for the other unseen.
   */
  checkbox: {
    boxSizing: "border-box",
    width: space.x2,
    height: space.x2,
    margin: 0,
    padding: 0,
    borderWidth: stroke.width,
    borderStyle: "solid",
    borderColor: colors.tertiary,
    borderRadius: space.half,
    backgroundColor: "transparent",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
    cursor: "pointer",
  },
  native: {
    appearance: "none",
    borderColor: { default: colors.tertiary, ":checked": colors.accent },
    backgroundColor: { default: "transparent", ":checked": colors.accent },
    backgroundImage: { default: null, ":checked": tick },
  },
  checked: { borderColor: colors.accent, backgroundColor: colors.accent, backgroundImage: tick },
  /** The form's own box once Radix's shows: over it, unseen & untouchable. */
  unseen: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    margin: 0,
    opacity: 0,
    pointerEvents: "none",
  },
  button: {
    cursor: { default: "pointer", ":disabled": "progress" },
  },
  failed: { color: colors.secondary },
});

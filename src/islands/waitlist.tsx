import * as stylex from "@stylexjs/stylex";
import { useState } from "preact/hooks";
import { isLocale, type Locale } from "../locale.ts";
import { isProductSlug, type ProductSlug } from "../site.ts";
import { colors, fontFeatures, media, space } from "../tokens.stylex.ts";
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
 * the confirmation page; hydrated, it posts in the background and answers in place.
 */
export function Waitlist({ product, locale, text }: WaitlistProps) {
  const [state, setState] = useState<State>({ $: "idle" });

  async function submit(form: HTMLFormElement) {
    setState({ $: "sending" });
    let response: Response;
    try {
      response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
    } catch {
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
                spellcheck={false}
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
            <input
              {...stylex.props(styles.checkbox)}
              type="checkbox"
              name="consent"
              value="yes"
              required
            />
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { default: colors.tertiary, ":focus": colors.primary },
    borderRadius: space.x1,
    boxShadow: { default: null, ":focus": `0 0 0 1px ${colors.primary}` },
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
  checkbox: {
    flexShrink: 0,
    width: "16px",
    height: "16px",
    // Centred on the first line of the sentence beside it.
    marginTop: `calc((${space.x3} - 16px) / 2)`,
    accentColor: colors.primary,
    cursor: "pointer",
  },
  button: {
    cursor: { default: "pointer", ":disabled": "progress" },
  },
  failed: { color: colors.secondary },
});

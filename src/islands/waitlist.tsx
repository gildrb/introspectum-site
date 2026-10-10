import * as stylex from "@stylexjs/stylex";
import { useState } from "preact/hooks";
import { email, isProductSlug, type ProductSlug } from "../site.ts";
import { colors, fontFeatures, media, space } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";

export type WaitlistProps = {
  product: ProductSlug;
  /** The sentence the person agrees to; `functions/api/waitlist.ts` stores the same one. */
  consent: string;
};

export function isWaitlistProps(value: unknown): value is WaitlistProps {
  return (
    typeof value === "object" &&
    value !== null &&
    "product" in value &&
    typeof value.product === "string" &&
    isProductSlug(value.product) &&
    "consent" in value &&
    typeof value.consent === "string"
  );
}

type State = { $: "idle" } | { $: "sending" } | { $: "joined" } | { $: "failed"; reason: string };

/**
 * A product's waiting-list form. Without JavaScript it posts to `/api/waitlist`, which redirects to
 * `/joined`; hydrated, it posts in the background and answers in place.
 */
export function Waitlist({ product, consent }: WaitlistProps) {
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
      setState({ $: "failed", reason: "The connection failed." });
      return;
    }
    if (response.ok) {
      setState({ $: "joined" });
      return;
    }
    const problem: unknown = await response.json().catch(() => null);
    const detail =
      typeof problem === "object" &&
      problem !== null &&
      "detail" in problem &&
      typeof problem.detail === "string"
        ? problem.detail
        : `The server answered ${response.status}.`;
    setState({ $: "failed", reason: detail });
  }

  let status: string;
  switch (state.$) {
    case "idle":
    case "sending":
      status = "";
      break;
    case "joined":
      status = "You are on the waiting list. We will write to you when testing opens.";
      break;
    case "failed":
      status = `${state.reason} Try again, or write to ${email}.`;
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
          <div {...stylex.props(styles.fields)}>
            <label {...stylex.props(ui.text, styles.field)}>
              <span {...stylex.props(ui.label)}>Email</span>
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
              <span {...stylex.props(ui.label)}>Company (optional)</span>
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
              Leave empty
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
            <span {...stylex.props(ui.prose)}>{consent}</span>
          </label>
          <p {...stylex.props(ui.text, ui.note)}>
            Read what we store and why in the{" "}
            <a {...stylex.props(ui.link, ui.focusRing)} href="/privacy">
              privacy policy
            </a>
            .
          </p>
          <button
            {...stylex.props(ui.reset, ui.text, ui.focusRing, styles.button)}
            type="submit"
            disabled={state.$ === "sending"}
          >
            {state.$ === "sending" ? "Sending…" : "Join the waiting list"}
          </button>
        </form>
      )}
      <p
        {...stylex.props(ui.text, state.$ === "joined" ? ui.prose : styles.failed)}
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
    height: { default: space.x5, [media.mobile]: space.x6 },
    paddingInline: space.x2,
    borderRadius: space.x1,
    backgroundColor: { default: colors.primary, ":hover": { [media.hover]: colors.secondary } },
    color: colors.bg,
    cursor: { default: "pointer", ":disabled": "progress" },
  },
  failed: { color: colors.secondary },
});

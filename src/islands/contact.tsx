import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "preact/hooks";
import { isLocale, type Locale } from "../locale.ts";
import {
  type InquiryTopic,
  inquiryMaxLength,
  inquiryTopics,
  isInquiryTopic,
  teamSizes,
} from "../site.ts";
import { colors, fontFeatures, media, space, stroke } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";

/** The form's words, translated on the server so the browser loads no message catalog. */
const textKeys = [
  "name",
  "email",
  "company",
  "team",
  "topic",
  "building",
  "choose",
  "honeypot",
  "submit",
  "sending",
  "sent",
  "failedConnection",
  "failedServer",
] as const;

export type ContactProps = {
  locale: Locale;
  text: Readonly<Record<(typeof textKeys)[number], string>>;
  /** Each topic's label, in the order of `inquiryTopics`. */
  topics: Readonly<Record<InquiryTopic, string>>;
};

export function isContactProps(value: unknown): value is ContactProps {
  if (typeof value !== "object" || value === null) return false;
  if (!("locale" in value) || typeof value.locale !== "string" || !isLocale(value.locale))
    return false;
  if (!("text" in value) || typeof value.text !== "object" || value.text === null) return false;
  if (!("topics" in value) || typeof value.topics !== "object" || value.topics === null)
    return false;
  const { text, topics } = value;
  return (
    textKeys.every((key) => key in text && typeof Reflect.get(text, key) === "string") &&
    inquiryTopics.every(
      (topic) => topic in topics && typeof Reflect.get(topics, topic) === "string",
    )
  );
}

/** A rejection names the field at fault, when there is one, so the form can point at it. */
type State =
  | { $: "idle" }
  | { $: "sending" }
  | { $: "sent" }
  | { $: "failed"; reason: string; field: string | null };

/**
 * The contact form. Without JavaScript it posts to `/api/contact`, which redirects to the
 * confirmation page; hydrated, it sets the topic the link to the page named (`?topic=`), posts in
 * the background and answers in place.
 */
export function Contact({ locale, text, topics }: ContactProps) {
  const [state, setState] = useState<State>({ $: "idle" });
  const [topic, setTopic] = useState<InquiryTopic | "">("");

  // After hydration, so the first render matches the server's, which cannot see the query.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("topic");
    if (requested !== null && isInquiryTopic(requested)) setTopic(requested);
  }, []);

  async function submit(form: HTMLFormElement) {
    setState({ $: "sending" });
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    }).catch(() => null);
    if (response === null) {
      setState({ $: "failed", reason: text.failedConnection, field: null });
      return;
    }
    if (response.ok) {
      setState({ $: "sent" });
      return;
    }
    // A rejected message explains itself in the visitor's language; anything else is our fault.
    const problem: unknown = await response.json().catch(() => null);
    if (
      typeof problem !== "object" ||
      problem === null ||
      !("detail" in problem) ||
      typeof problem.detail !== "string"
    ) {
      setState({ $: "failed", reason: text.failedServer, field: null });
      return;
    }
    const field = "field" in problem && typeof problem.field === "string" ? problem.field : null;
    setState({ $: "failed", reason: problem.detail, field });
    const control = field === null ? null : form.elements.namedItem(field);
    if (control instanceof HTMLElement) control.focus();
  }

  let status: string;
  switch (state.$) {
    case "idle":
    case "sending":
      status = "";
      break;
    case "sent":
      status = text.sent;
      break;
    case "failed":
      status = state.reason;
      break;
    default: {
      const _: never = state;
      return _;
    }
  }
  const invalid = (field: string) => state.$ === "failed" && state.field === field;

  return (
    <div {...stylex.props(styles.contact)}>
      {state.$ !== "sent" && (
        <form
          {...stylex.props(styles.form)}
          method="post"
          action="/api/contact"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(event.currentTarget);
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <div {...stylex.props(styles.fields)}>
            <label {...stylex.props(ui.text, styles.field)}>
              <span {...stylex.props(ui.label)}>{text.name}</span>
              <input
                {...stylex.props(ui.text, styles.control)}
                type="text"
                name="name"
                required
                maxLength={inquiryMaxLength.name}
                autoComplete="name"
                spellCheck="false"
                aria-invalid={invalid("name")}
              />
            </label>
            <label {...stylex.props(ui.text, styles.field)}>
              <span {...stylex.props(ui.label)}>{text.email}</span>
              <input
                {...stylex.props(ui.text, styles.control)}
                type="email"
                name="email"
                required
                maxLength={inquiryMaxLength.email}
                autoComplete="email"
                spellCheck="false"
                aria-invalid={invalid("email")}
              />
            </label>
            <label {...stylex.props(ui.text, styles.field)}>
              <span {...stylex.props(ui.label)}>{text.company}</span>
              <input
                {...stylex.props(ui.text, styles.control)}
                type="text"
                name="company"
                maxLength={inquiryMaxLength.company}
                autoComplete="organization"
                spellCheck="false"
                aria-invalid={invalid("company")}
              />
            </label>
            <label {...stylex.props(ui.text, styles.field)}>
              <span {...stylex.props(ui.label)}>{text.team}</span>
              <select
                {...stylex.props(ui.text, styles.control)}
                name="team"
                required
                aria-invalid={invalid("team")}
              >
                <option value="">{text.choose}</option>
                {teamSizes.map((size) => (
                  <option key={size} value={size}>
                    {size.replace("-", "–")}
                  </option>
                ))}
              </select>
            </label>
            <label {...stylex.props(ui.text, styles.field, styles.wide)}>
              <span {...stylex.props(ui.label)}>{text.topic}</span>
              <select
                {...stylex.props(ui.text, styles.control)}
                name="topic"
                required
                value={topic}
                onChange={(event) => {
                  const chosen = event.currentTarget.value;
                  setTopic(isInquiryTopic(chosen) ? chosen : "");
                }}
                aria-invalid={invalid("topic")}
              >
                <option value="">{text.choose}</option>
                {inquiryTopics.map((option) => (
                  <option key={option} value={option}>
                    {topics[option]}
                  </option>
                ))}
              </select>
            </label>
            <label {...stylex.props(ui.text, styles.field, styles.wide)}>
              <span {...stylex.props(ui.label)}>{text.building}</span>
              <textarea
                {...stylex.props(ui.text, styles.control, styles.textarea)}
                name="building"
                required
                rows={6}
                maxLength={inquiryMaxLength.building}
                aria-invalid={invalid("building")}
              />
            </label>
          </div>
          {/* Left empty by people, filled by bots; the server turns away any message that has it. */}
          <div {...stylex.props(ui.srOnly)} aria-hidden="true">
            <label>
              {text.honeypot}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
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
        {...stylex.props(state.$ === "sent" ? ui.prose : [ui.text, styles.failed])}
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
    </div>
  );
}

const styles = stylex.create({
  contact: { display: "flex", flexDirection: "column" },
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
  wide: { gridColumn: "1 / -1" },
  control: {
    boxSizing: "border-box",
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
    // Names, addresses and descriptions are written in lowercase as much as capitals.
    fontFeatureSettings: fontFeatures.prose,
  },
  textarea: {
    height: "auto",
    minHeight: space.x6,
    paddingBlock: space.x1,
    resize: "vertical",
  },
  button: {
    cursor: { default: "pointer", ":disabled": "progress" },
  },
  failed: { color: colors.secondary },
});

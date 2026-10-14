import * as Select from "@radix-ui/react-select";
import * as stylex from "@stylexjs/stylex";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { useHydrated } from "./hydrated.ts";
import { isLocale, type Locale } from "../locale.ts";
import {
  type InquiryTopic,
  inquiryMaxLength,
  inquiryTopics,
  isInquiryTopic,
  isTeamSize,
  type TeamSize,
  teamSizes,
} from "../site.ts";
import { colors, fontFeatures, layer, media, shadows, space, stroke } from "../tokens.stylex.ts";
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
 * confirmation page, and its lists are the browser's own. Hydrated, its lists open the site's own
 * choices in place of the system's, it sets the topic the link to the page named (`?topic=`),
 * posts in the background and answers in place.
 */
export function Contact({ locale, text, topics }: ContactProps) {
  const [state, setState] = useState<State>({ $: "idle" });
  const [team, setTeam] = useState<TeamSize | "">("");
  const [topic, setTopic] = useState<InquiryTopic | "">("");
  const formRef = useRef<HTMLFormElement>(null);

  // On hydration, while the browser's lists are still in place: keep what was chosen in them
  // before it, else the topic the link named, which the server cannot see.
  useLayoutEffect(() => {
    const chosen = (name: string) => {
      const list = formRef.current?.elements.namedItem(name);
      return list instanceof HTMLSelectElement ? list.value : "";
    };
    const size = chosen("team");
    if (isTeamSize(size)) setTeam(size);
    const picked = chosen("topic");
    const requested = new URLSearchParams(window.location.search).get("topic") ?? "";
    if (isInquiryTopic(picked)) setTopic(picked);
    else if (isInquiryTopic(requested)) setTopic(requested);
  }, []);
  // The browser's lists until hydration, so the first render matches the server's; Radix's after.
  // After the effect above, so it reads the browser's lists before they change.
  const hydrated = useHydrated();

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
    // Each control names its field, Radix's lists included, whose own form value is hidden.
    const control = Array.from(form.querySelectorAll<HTMLElement>("[data-field]")).find(
      (element) => element.dataset.field === field,
    );
    control?.focus();
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
          ref={formRef}
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
                data-field="name"
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
                data-field="email"
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
                data-field="company"
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
              <Choice
                name="team"
                placeholder={text.choose}
                options={teamSizes.map((size) => ({ value: size, label: size.replace("-", "–") }))}
                value={team}
                onChange={setTeam}
                interactive={hydrated}
                invalid={invalid("team")}
              />
            </label>
            <label {...stylex.props(ui.text, styles.field, styles.wide)}>
              <span {...stylex.props(ui.label)}>{text.topic}</span>
              <Choice
                name="topic"
                placeholder={text.choose}
                options={inquiryTopics.map((option) => ({ value: option, label: topics[option] }))}
                value={topic}
                onChange={setTopic}
                interactive={hydrated}
                invalid={invalid("topic")}
              />
            </label>
            <label {...stylex.props(ui.text, styles.field, styles.wide)}>
              <span {...stylex.props(ui.label)}>{text.building}</span>
              <textarea
                data-field="building"
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

/**
 * A required list, the same box before & after hydration. Its value is always a `<select>` of the
 * browser's: before hydration it is the list itself, which posts without JavaScript; after, it lies
 * unseen over Radix's list, whose choices open on the site's own surface instead of the system's
 * picker. It still posts the value & checks that one was chosen: the browser's message then points
 * at the list's box, and the focus the browser gives it passes on to Radix's list. The chevron is
 * drawn over either, in the same place.
 */
function Choice<Value extends string>({
  name,
  placeholder,
  options,
  value,
  onChange,
  interactive,
  invalid,
}: {
  name: string;
  placeholder: string;
  options: readonly { value: Value; label: string }[];
  value: Value | "";
  onChange: (value: Value) => void;
  interactive: boolean;
  invalid: boolean;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <span {...stylex.props(styles.choice)}>
      {interactive && (
        <Select.Root
          value={value}
          onValueChange={(chosen) => {
            const option = options.find((candidate) => candidate.value === chosen);
            if (option === undefined) throw new Error(`Not a choice of ${name}: ${chosen}`);
            onChange(option.value);
          }}
        >
          <Select.Trigger
            {...stylex.props(ui.text, styles.control, styles.list, styles.trigger)}
            ref={trigger}
            data-field={name}
            aria-invalid={invalid}
          >
            <Select.Value {...stylex.props(styles.value)} placeholder={placeholder} />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content {...stylex.props(styles.popover)} position="popper" sideOffset={4}>
              <Select.Viewport>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    {...stylex.props(ui.text, ui.control, styles.option)}
                    value={option.value}
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator {...stylex.props(styles.check)}>
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path
                          d="M3.5 8.5l3 3 6-7"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      )}
      {interactive ? (
        <select
          {...stylex.props(styles.unseen)}
          name={name}
          required
          value={value}
          tabIndex={-1}
          aria-hidden="true"
          onFocus={() => trigger.current?.focus()}
        >
          <option value="" />
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        // Uncontrolled, so a choice made before hydration survives it (see `Contact`).
        <select
          {...stylex.props(ui.text, styles.control, styles.list, styles.native)}
          name={name}
          required
          data-field={name}
          aria-invalid={invalid}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      <svg {...stylex.props(styles.chevron)} viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M4 6l4 4 4-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
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
  /** The list's box, so the chevron can sit at its end. */
  choice: { position: "relative", display: "block" },
  /** Room at the end for the chevron, over the browser's list & Radix's alike. */
  list: { paddingInlineEnd: space.x5, cursor: "pointer" },
  native: { appearance: "none" },
  /** The form's own `<select>` once Radix's list shows: over the list's box, unseen & untouchable. */
  unseen: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    margin: 0,
    opacity: 0,
    pointerEvents: "none",
  },
  /** Laid out like the browser's list: the choice at the start, centred in the box's height. */
  trigger: {
    display: "flex",
    alignItems: "center",
    fontSize: "inherit",
    lineHeight: "inherit",
    textAlign: "start",
  },
  value: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  chevron: {
    position: "absolute",
    insetInlineEnd: space.x2,
    top: "50%",
    width: space.x2,
    height: space.x2,
    transform: "translateY(-50%)",
    color: colors.tertiary,
    pointerEvents: "none",
  },
  /** The choices: a card over the page, at least the list's width, raised, without an edge. */
  popover: {
    zIndex: layer.popover,
    boxSizing: "border-box",
    minWidth: "var(--radix-select-trigger-width)",
    maxHeight: "var(--radix-select-content-available-height)",
    padding: space.x1,
    borderRadius: space.x1,
    boxShadow: shadows.raised,
    backgroundColor: colors.surface,
    color: colors.primary,
    overflowY: "auto",
  },
  /** One choice, as tall as the list; the pointer and the arrow keys move focus over them. */
  option: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    height: { default: space.x5, [media.mobile]: space.x6 },
    paddingInlineStart: space.x2,
    paddingInlineEnd: space.x5,
    borderRadius: space.half,
    outline: "none",
    backgroundColor: { default: "transparent", ":focus": colors.bg },
    color: colors.primary,
    fontFeatureSettings: fontFeatures.prose,
    cursor: "pointer",
  },
  /** The chosen one's check, where the list's chevron sits. */
  check: {
    position: "absolute",
    insetInlineEnd: space.x2,
    display: "flex",
    width: space.x2,
    height: space.x2,
  },
  button: {
    cursor: { default: "pointer", ":disabled": "progress" },
  },
  failed: { color: colors.secondary },
});

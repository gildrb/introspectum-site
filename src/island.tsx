import * as stylex from "@stylexjs/stylex";
import type { FunctionComponent } from "preact";
import type { Contact } from "./islands/contact.tsx";
import type { Waitlist } from "./islands/waitlist.tsx";

/** Components that `client.ts` hydrates in the browser; everything else stays static HTML. */
export type Islands = {
  waitlist: typeof Waitlist;
  contact: typeof Contact;
};

const styles = stylex.create({ island: { display: "contents" } });

/** Server-renders an island and records its props, so hydration renders exactly the same tree. */
export function Island<Props extends object>({
  name,
  component: Render,
  props,
}: {
  name: keyof Islands;
  component: FunctionComponent<Props>;
  props: Props;
}) {
  return (
    <div {...stylex.props(styles.island)} data-island={name} data-props={JSON.stringify(props)}>
      <Render {...props} />
    </div>
  );
}

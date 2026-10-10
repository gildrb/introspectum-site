import * as stylex from "@stylexjs/stylex";
import { type Assets, Page, Section, Text } from "../layout.tsx";
import {
  company,
  consulting,
  email,
  inSentence,
  listing,
  mailto,
  methods,
  origin,
  principles,
  products,
} from "../site.ts";
import { colors, space } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";

/** The opening line: a fact the visitor can check, with its source. */
const hook = {
  text: "96% of developers do not fully trust AI-generated code. Only 48% always check it before they commit.",
  source: "Sonar, State of Code Developer Survey 2026",
  href: "https://www.sonarsource.com/company/press-releases/sonar-data-reveals-critical-verification-gap-in-ai-coding/",
};

/**
 * The elevator pitch, under three minutes of reading (checked at build, see `render.tsx`). It
 * opens on the Golden Circle (a hook answered by why, then what and how) and closes on the
 * Redneruhr's remaining steps: who we are and what to do next.
 */
export function Home({ assets, shareImage }: { assets: Assets; shareImage: string }) {
  return (
    <Page
      assets={assets}
      meta={{
        path: "/",
        title: company.name,
        description: company.description,
        shareImage,
        type: "website",
        index: true,
        script: false,
        mono: false,
        jsonLd: organization,
      }}
    >
      <p {...stylex.props(ui.heading, styles.hook)}>{hook.text}</p>
      <p {...stylex.props(ui.text, styles.source)}>
        <a
          {...stylex.props(ui.quiet, ui.focusRing, ui.outbound)}
          href={hook.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {hook.source}
        </a>
      </p>
      <Section id="why" label="Why">
        <Text>{company.mission}</Text>
      </Section>
      <Section id="what" label="What we build">
        <ul {...stylex.props(styles.entries)}>
          {products.map((product) => (
            <li>
              <a
                {...stylex.props(ui.text, ui.entry, ui.onward, ui.focusRing)}
                href={`/products/${product.slug}`}
              >
                {product.name}
              </a>
              <Text>{product.what}</Text>
              <Text note>{product.audience}</Text>
            </li>
          ))}
          <li>
            <a {...stylex.props(ui.text, ui.entry, ui.focusRing)} href={mailto(consulting.subject)}>
              Consulting
            </a>
            <Text>{consulting.what}</Text>
            <Text note>{consulting.audience}</Text>
          </li>
        </ul>
      </Section>
      <Section id="how" label="How">
        <Text>
          We use {listing(methods.map(inSentence))}. We hold to three principles:{" "}
          {listing(principles)}.
        </Text>
      </Section>
      <Section id="who" label="Who we are">
        <Text>
          {company.who}{" "}
          <a {...stylex.props(ui.link, ui.focusRing)} href="/about">
            More about us
          </a>
        </Text>
      </Section>
      <NextSteps />
    </Page>
  );
}

/** What a visitor can do next; it closes the homepage and every blog post. */
export function NextSteps() {
  return (
    <Section id="next" label="Next">
      <Text>
        <a {...stylex.props(ui.link, ui.focusRing)} href="/products">
          Join a waiting list
        </a>{" "}
        to test a product before its release.
      </Text>
      <Text>
        <a {...stylex.props(ui.link, ui.focusRing)} href={mailto(consulting.subject)}>
          Send a consulting inquiry
        </a>{" "}
        to work with us now.
      </Text>
      <Text>
        <a {...stylex.props(ui.link, ui.focusRing)} href="/join">
          Join us
        </a>{" "}
        as founding engineer or intern.
      </Text>
    </Section>
  );
}

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${origin}/#organization`,
  name: company.name,
  legalName: company.legalName,
  url: `${origin}/`,
  email,
  description: company.description,
  founder: { "@type": "Person", name: company.founder },
  address: { "@type": "PostalAddress", addressCountry: "IM" },
};

const styles = stylex.create({
  hook: { maxWidth: space.content },
  source: { marginTop: space.x1, color: colors.tertiary },
  entries: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x3,
    listStyle: "none",
  },
});

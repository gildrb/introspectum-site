import * as stylex from "@stylexjs/stylex";
import { Island } from "../island.tsx";
import { Waitlist } from "../islands/waitlist.tsx";
import { type Assets, Page, Section, Stack, Text, Title } from "../layout.tsx";
import {
  consulting,
  inSentence,
  listing,
  mailto,
  type Product,
  products,
  title,
  waitlistConsent,
} from "../site.ts";
import { space } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";

export const productsIntro =
  "Three products, all before release. Join a waiting list to test one first.";

export function ProductsPage({ assets, shareImage }: { assets: Assets; shareImage: string }) {
  return (
    <Page
      assets={assets}
      meta={{
        path: "/products",
        title: title("Products"),
        description: productsIntro,
        shareImage,
        type: "website",
        index: true,
        script: false,
        mono: false,
      }}
    >
      <Title>Products</Title>
      <Text lead>{productsIntro}</Text>
      <ul {...stylex.props(styles.entries)}>
        {products.map((product) => (
          <li>
            <a
              {...stylex.props(ui.text, ui.entry, ui.onward, ui.focusRing)}
              href={`/products/${product.slug}`}
            >
              {product.name}
            </a>
            <Text note>{product.status}</Text>
            <Text>{product.what}</Text>
            <Text note>{product.audience}</Text>
          </li>
        ))}
      </ul>
      <Section id="consulting" label="Consulting">
        <Text>
          {consulting.what} {consulting.audience}
        </Text>
        <Text>
          <a {...stylex.props(ui.link, ui.focusRing)} href={mailto(consulting.subject)}>
            Send a consulting inquiry
          </a>
        </Text>
      </Section>
    </Page>
  );
}

export function ProductPage({
  assets,
  shareImage,
  product,
}: {
  assets: Assets;
  shareImage: string;
  product: Product;
}) {
  return (
    <Page
      assets={assets}
      meta={{
        path: `/products/${product.slug}`,
        title: title("Products", product.name),
        description: product.what,
        shareImage,
        type: "website",
        index: true,
        script: true,
        mono: false,
      }}
    >
      <Title note={product.status}>{product.name}</Title>
      <Stack>
        <Text lead>{product.what}</Text>
        <Text>{product.audience}</Text>
        {product.details.map((paragraph) => (
          <Text>{paragraph}</Text>
        ))}
      </Stack>
      <Section id="methods" label="Methods">
        <Text>
          {listing(
            product.methods.map((method, index) => (index === 0 ? method : inSentence(method))),
          )}
          .
        </Text>
      </Section>
      <Section id="waitlist" label="Waiting list">
        <Text>Leave your email address to test the {product.name} before its release.</Text>
        <Island
          name="waitlist"
          component={Waitlist}
          props={{ product: product.slug, consent: waitlistConsent(product) }}
        />
      </Section>
      <Section id="consulting" label="Consulting">
        <Text>
          Need help before it ships?{" "}
          <a
            {...stylex.props(ui.link, ui.focusRing)}
            href={mailto(`${consulting.subject}: ${product.name}`)}
          >
            Send a consulting inquiry
          </a>
          .
        </Text>
      </Section>
    </Page>
  );
}

const styles = stylex.create({
  entries: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x3,
    marginTop: space.x6,
    listStyle: "none",
  },
});

import * as stylex from "@stylexjs/stylex";
import type { DocPage as Doc } from "../content.ts";
import { type Assets, Page, Stack, Text, Title } from "../layout.tsx";
import { Markdown } from "../markdown.tsx";
import { title } from "../site.ts";
import { ui } from "../ui.tsx";

/** A plain page written in Markdown: About, Privacy. */
export function DocPage({
  assets,
  shareImage,
  doc,
  description,
}: {
  assets: Assets;
  shareImage: string;
  doc: Doc;
  description: string;
}) {
  return (
    <Page
      assets={assets}
      meta={{
        path: `/${doc.slug}`,
        title: title(doc.title),
        description,
        shareImage,
        type: "website",
        index: true,
        script: false,
        mono: false,
      }}
    >
      <Title>{doc.title}</Title>
      <Markdown blocks={doc.blocks} />
    </Page>
  );
}

/** Where a waiting-list sign-up lands when the form was sent without JavaScript. */
export function JoinedPage({ assets, shareImage }: { assets: Assets; shareImage: string }) {
  return (
    <Page
      assets={assets}
      meta={{
        path: "/joined",
        title: title("Waiting list"),
        description: "You are on the waiting list.",
        shareImage,
        type: "website",
        index: false,
        script: false,
        mono: false,
      }}
    >
      <Title>You are on the waiting list</Title>
      <Stack>
        <Text>We will write to you when testing opens.</Text>
        <Text>
          <a {...stylex.props(ui.link, ui.focusRing)} href="/products">
            Back to the products
          </a>
        </Text>
      </Stack>
    </Page>
  );
}

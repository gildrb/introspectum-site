import * as stylex from "@stylexjs/stylex";
import { type Assets, Page, Text, Title } from "../layout.tsx";
import { type Block, Markdown } from "../markdown.tsx";
import { email, mailto, roles, title } from "../site.ts";
import { space } from "../tokens.stylex.ts";

const joinIntro = "Introspectum is a small team. There are two ways to join it.";

/** Each role as the site's Markdown blocks, so it reads and spaces like any other text. */
const blocks: Block[] = roles.flatMap((role) => [
  { type: "h2", text: role.title },
  ...role.intro.map((text): Block => ({ type: "p", text })),
  ...role.lists.flatMap(({ label, items }): Block[] => [
    { type: "h3", text: label },
    { type: "ul", items: [...items] },
  ]),
  { type: "p", text: `${role.apply} Write to [${email}](${mailto(role.subject)}).` },
]);

export function JoinPage({ assets, shareImage }: { assets: Assets; shareImage: string }) {
  return (
    <Page
      assets={assets}
      meta={{
        path: "/join",
        title: title("Join us"),
        description: `${joinIntro} Founding engineer and internships.`,
        shareImage,
        type: "website",
        index: true,
        script: false,
        mono: false,
      }}
    >
      <Title>Join us</Title>
      <Text lead>{joinIntro}</Text>
      <div {...stylex.props(styles.roles)}>
        <Markdown blocks={blocks} />
      </div>
    </Page>
  );
}

const styles = stylex.create({ roles: { marginTop: space.x6 } });

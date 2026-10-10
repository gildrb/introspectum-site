import * as stylex from "@stylexjs/stylex";
import type { Post } from "../content.ts";
import { posts } from "../content.ts";
import { type Assets, Page, Text, Title } from "../layout.tsx";
import { Markdown } from "../markdown.tsx";
import { authors, company, origin, title } from "../site.ts";
import { space } from "../tokens.stylex.ts";
import { Figures, ui } from "../ui.tsx";
import { NextSteps } from "./home.tsx";

export const blogIntro = "Weekly writing on AI, software engineering and regulation.";

export function BlogPage({ assets, shareImage }: { assets: Assets; shareImage: string }) {
  return (
    <Page
      assets={assets}
      meta={{
        path: "/blog",
        title: title("Blog"),
        description: blogIntro,
        shareImage,
        type: "website",
        index: true,
        script: false,
        mono: false,
      }}
    >
      <Title>Blog</Title>
      <Text lead>{blogIntro}</Text>
      <Text note>
        Follow it by{" "}
        <a {...stylex.props(ui.link, ui.focusRing)} href="/feed.xml">
          RSS
        </a>
        .
      </Text>
      {posts.length === 0 ? (
        <div {...stylex.props(styles.entries)}>
          <Text>No posts yet.</Text>
        </div>
      ) : (
        <ul {...stylex.props(styles.entries)}>
          {posts.map((post) => (
            <li>
              <p {...stylex.props(ui.text, ui.note)}>
                <time dateTime={post.date}>
                  <Figures text={post.date} />
                </time>
              </p>
              <a
                {...stylex.props(ui.text, ui.entry, ui.onward, ui.focusRing)}
                href={`/blog/${post.slug}`}
              >
                {post.title}
              </a>
              <Text>{post.description}</Text>
              <Text note>{authors[post.author].name}</Text>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

export function PostPage({
  assets,
  shareImage,
  post,
}: {
  assets: Assets;
  shareImage: string;
  post: Post;
}) {
  const author = authors[post.author];
  const url = `${origin}/blog/${post.slug}`;
  return (
    <Page
      assets={assets}
      meta={{
        path: `/blog/${post.slug}`,
        title: title("Blog", post.title),
        description: post.description,
        shareImage,
        type: "article",
        index: true,
        script: false,
        mono: post.blocks.some((block) => block.type === "code"),
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "@id": `${url}#post`,
          url,
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          image: `${origin}${shareImage}`,
          author: { "@type": "Person", name: author.name, jobTitle: author.role },
          publisher: {
            "@id": `${origin}/#organization`,
            "@type": "Organization",
            name: company.name,
          },
          inLanguage: "en",
        },
        head: (
          <>
            <meta property="article:published_time" content={post.date} />
            <meta property="article:author" content={author.name} />
          </>
        ),
      }}
    >
      <article>
        <Title
          note={
            <>
              <time dateTime={post.date}>
                <Figures text={post.date} />
              </time>
              , {author.name}, {post.minutes} min read
            </>
          }
        >
          {post.title}
        </Title>
        <Markdown blocks={post.blocks} />
      </article>
      <NextSteps />
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

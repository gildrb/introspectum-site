import * as stylex from "@stylexjs/stylex";
import { type Post, posts } from "../content.ts";
import { day, translators } from "../i18n.ts";
import { type Assets, Page, Text, Title } from "../layout.tsx";
import { href, type Locale, localeInfo } from "../locale.ts";
import { Markdown } from "../markdown.tsx";
import { authors, company, origin } from "../site.ts";
import { space } from "../tokens.stylex.ts";
import { richLink, ui } from "../ui.tsx";
import { NextSteps } from "./home.tsx";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

export function BlogPage({ assets, locale, path, alternates, shareImage }: PageProps) {
  const t = translators[locale];
  const list = posts[locale];
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title", { brand: company.name, page: t.text("blog_title") }),
        description: t.text("blog_intro"),
        shareImage,
        type: "website",
        index: true,
        script: false,
        mono: false,
      }}
    >
      <Title>{t.text("blog_title")}</Title>
      <Text lead>{t.text("blog_intro")}</Text>
      <Text quiet>
        {t.rich("blog_feed", { link: richLink(`${localeInfo[locale].prefix}/feed.xml`) })}
      </Text>
      {list.length === 0 ? (
        <div {...stylex.props(styles.entries)}>
          <Text>{t.text("blog_empty")}</Text>
        </div>
      ) : (
        <ul {...stylex.props(styles.entries)}>
          {list.map((post) => (
            <li>
              <p {...stylex.props(ui.text, ui.note)}>
                <time dateTime={post.date}>{t.text("blog_date", { date: day(post.date) })}</time>
              </p>
              <a
                {...stylex.props(ui.text, ui.entry, ui.onward, ui.focusRing)}
                href={href(locale, "blog", post.slug)}
              >
                {post.title}
              </a>
              <Text>{post.description}</Text>
              <p {...stylex.props(ui.text, ui.note)}>{authors[post.author].name}</p>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

export function PostPage({ post, ...props }: PageProps & { post: Post }) {
  const { assets, locale, path, alternates, shareImage } = props;
  const t = translators[locale];
  const author = authors[post.author];
  const url = `${origin}${path}`;
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title_nested", {
          brand: company.name,
          section: t.text("blog_title"),
          page: post.title,
        }),
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
          author: { "@type": "Person", name: author.name },
          publisher: {
            "@id": `${origin}/#organization`,
            "@type": "Organization",
            name: company.name,
          },
          inLanguage: locale,
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
          note={t.text("blog_post_meta", {
            date: day(post.date),
            author: author.name,
            minutes: post.minutes,
          })}
        >
          {post.title}
        </Title>
        <Markdown blocks={post.blocks} />
      </article>
      <NextSteps locale={locale} />
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

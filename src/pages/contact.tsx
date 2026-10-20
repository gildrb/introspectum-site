import * as stylex from "@stylexjs/stylex";
import { Content, Hero } from "../blocks.tsx";
import type { Doc } from "../content.ts";
import { translators } from "../i18n.ts";
import { Island } from "../island.tsx";
import { Contact } from "../islands/contact.tsx";
import { type Assets, Page } from "../layout.tsx";
import { href, type Locale } from "../locale.ts";
import { Markdown, usesItalic } from "../markdown.tsx";
import { company, email, type InquiryTopic } from "../site.ts";
import { colors, media, space } from "../tokens.stylex.ts";
import { richLink, ui } from "../ui.tsx";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

/**
 * The contact page: the form first, in a panel like a product's waiting list, then the page's
 * Markdown (`content/<locale>/contact.md`), which keeps the email address as the other way in.
 */
export function ContactPage({ doc, ...props }: PageProps & { doc: Doc }) {
  const { assets, locale, path, alternates, shareImage } = props;
  const t = translators[locale];
  const topics: Readonly<Record<InquiryTopic, string>> = {
    "ai-code-audit": t.text("contact_form_topic_ai_code_audit"),
    "erp-setup": t.text("contact_form_topic_erp_setup"),
    "software-factory": t.text("product_software_factory_name"),
    "erp-crm": t.text("product_erp_crm_name"),
    general: t.text("contact_form_topic_general"),
  };
  return (
    <Page
      assets={assets}
      meta={{
        locale,
        path,
        alternates,
        title: t.text("page_title", { brand: company.name, page: doc.title }),
        description: t.text("contact_description"),
        shareImage,
        type: "website",
        index: true,
        mono: false,
        italic: usesItalic(doc.blocks),
      }}
    >
      <Hero title={doc.title} lead={t.text("contact_form_intro")} />
      <Content>
        <div {...stylex.props(ui.textWidth, styles.form)}>
          <Island
            name="contact"
            component={Contact}
            props={{
              locale,
              topics,
              text: {
                name: t.text("contact_form_name_label"),
                email: t.text("contact_form_email_label"),
                company: t.text("contact_form_company_label"),
                team: t.text("contact_form_team_label"),
                topic: t.text("contact_form_topic_label"),
                building: t.text("contact_form_building_label"),
                choose: t.text("contact_form_choose"),
                honeypot: t.text("contact_form_honeypot_label"),
                submit: t.text("contact_form_submit"),
                sending: t.text("contact_form_sending"),
                sent: t.text("contact_form_sent"),
                failedConnection: t.text("contact_form_failed_connection", { email }),
                failedServer: t.text("contact_form_failed_server", { email }),
              },
            }}
          />
          <p {...stylex.props(ui.small, ui.label)}>
            {t.rich("contact_form_privacy", { link: richLink(href(locale, "privacy")) })}
          </p>
        </div>
        <div {...stylex.props(ui.textWidth, styles.more)}>
          <Markdown blocks={doc.blocks} />
        </div>
      </Content>
    </Page>
  );
}

const styles = stylex.create({
  form: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x3,
    padding: { default: space.x3, [media.desktop]: space.x4 },
    borderRadius: space.x1,
    backgroundColor: colors.surface,
  },
  more: { marginTop: { default: space.x6, [media.desktop]: space.x8 } },
});

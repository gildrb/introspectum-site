import type { MessageId, Values } from "./i18n.ts";
import { href, type Locale } from "./locale.ts";
import type { MachineName } from "./figures/machines.ts";

/**
 * The site's facts and structure. Text lives in `src/locales/`: everything here that a visitor
 * reads is a message ID, except proper names, which are the same in every language.
 */

export const origin = "https://introspectum.eu";
/** One address for inquiries, applications and the waiting lists. */
export const email = "fabian.klopfer@introspectum.eu";

export const company = {
  name: "Introspectum",
  legalName: "Introspectum Limited",
  founder: "Fabian Klopfer",
} as const;

/** A member of the team, by the name pages show, with their public profile. */
export type Person = { linkedin: `https://www.linkedin.com/in/${string}/` };

export const people = {
  "Fabian Klopfer": { linkedin: "https://www.linkedin.com/in/someusername1/" },
  "Marc Gsell": { linkedin: "https://www.linkedin.com/in/marc-gsell/" },
} as const satisfies Record<string, Person>;

export type PersonName = keyof typeof people;

export function isPersonName(value: string): value is PersonName {
  return Object.hasOwn(people, value);
}

/** A `mailto:` link to the company address with the subject filled in. */
export function mailto(subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

/**
 * What a conversation can be about: a fixed-scope consulting offer or a product. The contact form
 * sends one of these as `topic`; the Worker accepts no other.
 */
export const inquiryTopics = [
  "erp-crm",
  "erp-setup",
  "software-factory",
  "ai-code-audit",
  "general",
] as const;

export type InquiryTopic = (typeof inquiryTopics)[number];

export function isInquiryTopic(value: string): value is InquiryTopic {
  return inquiryTopics.some((topic) => topic === value);
}

/** How many people build software at the company that writes; the contact form asks for one. */
export const teamSizes = ["1", "2-10", "11-50", "51-200", "200+"] as const;

export type TeamSize = (typeof teamSizes)[number];

export function isTeamSize(value: string): value is TeamSize {
  return teamSizes.some((size) => size === value);
}

/** The longest answer the contact form takes per field; the form and the Worker both hold to it. */
export const inquiryMaxLength = { name: 200, email: 254, company: 200, building: 2000 } as const;

/** The contact page with its form set to `topic`. */
export function contactHref(locale: Locale, topic: InquiryTopic): string {
  return `${href(locale, "contact")}?topic=${topic}`;
}

/**
 * A consulting offer people can say yes to: a name, what we do, what you get, how long it takes,
 * and what it costs from. `weeks` and `priceFrom` (whole euros, before VAT) are `null` while not
 * decided; the card then leaves them out.
 */
export type Offer = {
  topic: Extract<InquiryTopic, "ai-code-audit" | "erp-setup">;
  title: MessageId;
  text: MessageId;
  result: MessageId;
  weeks: number | null;
  priceFrom: number | null;
};

export const offers: readonly Offer[] = [
  {
    topic: "erp-setup",
    title: "offer_erp_title",
    text: "offer_erp_text",
    result: "offer_erp_result",
    weeks: null,
    priceFrom: null,
  },
  {
    topic: "ai-code-audit",
    title: "offer_audit_title",
    text: "offer_audit_text",
    result: "offer_audit_result",
    weeks: null,
    priceFrom: null,
  },
];

/**
 * The pilot programme a waiting list leads to. `null` while not decided: the page then shows a
 * visible gap, never a guess. `opens` is a day at midnight UTC.
 */
export const pilot: { spots: number | null; opens: Date | null } = { spots: null, opens: null };

/**
 * What a buyer asks before handing over data, one term each. `contact` links the contact page
 * and names `email`.
 */
export type TrustFact = { $: "fact"; text: MessageId } | { $: "contact"; text: MessageId };

export const trust: readonly { term: MessageId; fact: TrustFact }[] = [
  // The ERP & CRM's specification (twenty-erp-srs.md): one VM per customer, no multi-tenancy.
  { term: "trust_installation", fact: { $: "fact", text: "trust_installation_text" } },
  { term: "trust_contact", fact: { $: "contact", text: "trust_contact_text" } },
];

/**
 * The Software Factory's measured runs, from the product repository's verification logs:
 * `docs/verification-logs/real-project-scale-2026-09-04.md` (graph builds; four repeated
 * self-ingestions gave byte-identical summaries) and `docs/smoke-demo.md` (the smoke alarm proven
 * with Prusti in three consecutive runs, 23 August 2026). Shown on the homepage and its page.
 */
export const graphRuns = {
  date: new Date("2026-09-04T00:00:00Z"),
  ownFiles: 113,
  ownNodes: 12_801,
  ownSeconds: 4.8,
  otherFiles: 95,
  otherNodes: 20_049,
  otherSeconds: 7.3,
  repeats: 4,
} as const;

export const proofRuns = { passed: 3, runs: 3 } as const;

/**
 * A published work the site cites. A message cites it with a tag named by its ID around the words
 * it backs, `<prusti>Prusti</prusti>`, and the page lists it under its number at the end (see
 * `citeTags` and `Sources`). Titles stay in their own language.
 */
export type Source = {
  /** Authors, or the organisation that published it. */
  by: string;
  title: string;
  /** Where it appeared: a journal, a conference, a publisher. */
  in?: string;
  year?: number;
  url: string;
  /** The language of the work, for `lang` and `hreflang`. */
  lang: "en" | "de";
};

export const sources = {
  sonar: {
    by: "Sonar",
    title: "State of Code Developer Survey report",
    year: 2026,
    url: "https://www.sonarsource.com/resources/developer-survey-report/",
    lang: "en",
  },
  cpg: {
    by: "Fabian Yamaguchi, Nico Golde, Daniel Arp, Konrad Rieck",
    title: "Modeling and Discovering Vulnerabilities with Code Property Graphs",
    in: "IEEE Symposium on Security and Privacy",
    year: 2014,
    url: "https://doi.org/10.1109/SP.2014.44",
    lang: "en",
  },
  c4: {
    by: "Simon Brown",
    title: "The C4 model for visualising software architecture",
    url: "https://c4model.com/",
    lang: "en",
  },
  "iso-15288": {
    by: "ISO, IEC, IEEE",
    title: "ISO/IEC/IEEE 15288:2023, Systems and software engineering: System life cycle processes",
    year: 2023,
    url: "https://www.iso.org/standard/81702.html",
    lang: "en",
  },
  prusti: {
    by: "Vytautas Astrauskas, Peter Müller, Federico Poli, Alexander J. Summers",
    title: "Leveraging Rust Types for Modular Specification and Verification",
    in: "Proceedings of the ACM on Programming Languages, OOPSLA",
    year: 2019,
    url: "https://doi.org/10.1145/3360573",
    lang: "en",
  },
  verus: {
    by: "Andrea Lattuada et al.",
    title: "Verus: Verifying Rust Programs using Linear Ghost Types",
    in: "Proceedings of the ACM on Programming Languages, OOPSLA",
    year: 2023,
    url: "https://doi.org/10.1145/3586037",
    lang: "en",
  },
  ripgrep: {
    by: "Andrew Gallant",
    title: "ripgrep",
    in: "GitHub",
    url: "https://github.com/BurntSushi/ripgrep",
    lang: "en",
  },
  gsn: {
    by: "Assurance Case Working Group",
    title: "Goal Structuring Notation Community Standard, Version 3",
    in: "Safety-Critical Systems Club",
    year: 2021,
    url: "https://scsc.uk/r1386.pdf",
    lang: "en",
  },
  "ieee-830": {
    by: "IEEE",
    title: "IEEE 830-1998, Recommended Practice for Software Requirements Specifications",
    year: 1998,
    url: "https://standards.ieee.org/ieee/830/1222/",
    lang: "en",
  },
  "ieee-1016": {
    by: "IEEE",
    title:
      "IEEE 1016-2009, Standard for Information Technology: Systems Design: Software Design Descriptions",
    year: 2009,
    url: "https://standards.ieee.org/ieee/1016/4502/",
    lang: "en",
  },
  twenty: {
    by: "Twenty",
    title: "twentyhq/twenty",
    in: "GitHub",
    url: "https://github.com/twentyhq/twenty",
    lang: "en",
  },
  "iso-4217": {
    by: "ISO",
    title: "ISO 4217, Currency codes",
    url: "https://www.iso.org/iso-4217-currency-codes.html",
    lang: "en",
  },
  "iso-29148": {
    by: "ISO, IEC, IEEE",
    title:
      "ISO/IEC/IEEE 29148:2018, Systems and software engineering: Life cycle processes: Requirements engineering",
    year: 2018,
    url: "https://www.iso.org/standard/72089.html",
    lang: "en",
  },
  turtle: {
    by: "Curtis Faith",
    title: "Way of the Turtle",
    in: "McGraw-Hill",
    year: 2007,
    url: "https://openlibrary.org/books/OL17563052M",
    lang: "en",
  },
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof sources;

/** A source as a page cites it: its ID, which names its tag in messages, and its number. */
export type Citation = { id: SourceId; number: number; source: Source };

/** A page's sources, numbered from 1 in the order of `cited`, each cited source once. */
export function numbered(cited: readonly SourceId[]): readonly Citation[] {
  return [...new Set(cited)].map((id, index) => ({ id, number: index + 1, source: sources[id] }));
}

/**
 * A figure from an old book, out of copyright: a woodcut, an engraving or a printed page, cleaned
 * to black lines on white. It is stored in `public/images/illustrations/` as `<file>-<width>` in
 * AVIF, WebP and JPEG at two widths. The caption credits the copy the scan was made from.
 */
export type Illustration = {
  file: string;
  widths: readonly [small: number, large: number];
  /** What it shows, for people who cannot see it. */
  alt: MessageId;
  /** Who made it. */
  by: string;
  /** The book it is from, in its own language. */
  work: string;
  lang: "de" | "en" | "it" | "la";
  /** The year of the printing the scan shows. */
  year: number;
  /** The library whose copy was scanned, where known. */
  holding?: string;
  /** Where the scan and its rights can be checked. */
  url: string;
};

export const illustrations = {
  tabula: {
    file: "tabula",
    widths: [800, 1600],
    alt: "illustration_tabula_alt",
    by: "Heinrich Khunrath",
    work: "Amphitheatrum sapientiae aeternae",
    lang: "la",
    year: 1609,
    holding: "Houghton Library, Harvard University",
    url: "https://commons.wikimedia.org/wiki/File:Houghton_Typ_620.09.482_Heinrich_Khunrath,_Amphitheatrvm_sapientiae_aeternae.jpg",
  },
  frege: {
    file: "frege",
    widths: [800, 941],
    alt: "illustration_frege_alt",
    by: "Gottlob Frege",
    work: "Begriffsschrift",
    lang: "de",
    year: 1879,
    holding: "Library of the Institute of Mathematics, Polish Academy of Sciences",
    url: "https://archive.org/details/rcin.org.pl.WA35_20448_6464_Begriffsschrift_50430",
  },
  pacioli: {
    file: "pacioli",
    widths: [800, 1600],
    alt: "illustration_pacioli_alt",
    by: "Luca Pacioli",
    work: "Summa de arithmetica, geometria, proportioni et proportionalità",
    lang: "it",
    year: 1494,
    holding: "Smithsonian Libraries",
    url: "https://library.si.edu/digital-library/book/summadearithmeti00paci",
  },
  playfair: {
    file: "playfair",
    widths: [800, 1600],
    alt: "illustration_playfair_alt",
    by: "William Playfair",
    work: "The Commercial and Political Atlas",
    lang: "en",
    year: 1786,
    url: "https://commons.wikimedia.org/wiki/File:Playfair_TimeSeries.png",
  },
  euclid: {
    file: "euclid",
    widths: [800, 896],
    alt: "illustration_euclid_alt",
    by: "Euclid",
    work: "Elementa geometriae",
    lang: "la",
    year: 1482,
    holding: "Smithsonian Libraries",
    url: "https://library.si.edu/digital-library/book/preclarissimusl00eucl",
  },
} as const satisfies Record<string, Illustration>;

/** The methods, in the order the homepage lists them. */
export const methods: readonly MessageId[] = [
  "method_formal_methods",
  "method_compiler_construction",
  "method_model_based",
  "method_ai_agents",
  "method_open_data",
  "method_reinforcement_learning",
];

/** The principles, in the order the homepage shows them: a name and one sentence each. */
export const principles: readonly { name: MessageId; text: MessageId }[] = [
  { name: "principle_proof", text: "principle_proof_text" },
  { name: "principle_data", text: "principle_data_text" },
  { name: "principle_traceability", text: "principle_traceability_text" },
];

/**
 * Kept apart from `products` so the browser bundle can check a slug without the rest. The ERP &
 * CRM comes first: it has the largest market.
 */
export const productSlugs = ["erp-crm", "software-factory", "trading-platform"] as const;

export type ProductSlug = (typeof productSlugs)[number];

export function isProductSlug(value: string): value is ProductSlug {
  return productSlugs.some((slug) => slug === value);
}

/**
 * A paragraph of a product page: a message and the values it formats, dates at midnight UTC (see
 * `day`). Its tags cite sources by ID (see `Source`).
 */
export type Paragraph = { text: MessageId; values?: Values };

/**
 * Where a product lives: `products` is what we sell or will sell, with a waiting list; `research`
 * is work we publish but do not sell, kept apart so it never stands beside an offer.
 */
export type Shelf = "products" | "research";

export type Product = {
  slug: ProductSlug;
  shelf: Shelf;
  name: MessageId;
  /** Where it stands; named for language models in `llms.txt`. */
  status: MessageId;
  /** What it does, in one sentence. */
  what: MessageId;
  /** Who it is for, in one sentence. */
  audience: MessageId;
  /** The figure on its card and beside its page's opening. */
  illustration: Illustration;
  /**
   * A drawn diagram under the illustration in the page's opening, where it has one: the figure's
   * lines redrawn and turned into the product's own graph (see `figures/machine.tsx`).
   */
  diagram?: MachineName;
  /** How it works, one paragraph each. */
  how: readonly Paragraph[];
  /**
   * The drawn machine beside "How it works", where it has one (see `figures/machine.tsx`): it
   * stands beside the paragraphs it shows, from paragraph `from` to the end of "How it works", or
   * `through` "Where it stands" as well where that part is what it shows too.
   */
  machine?: { name: MachineName; from: number; through: "how" | "state" };
  /** Where it stands: what works, what was measured, what is not built yet. */
  state: readonly Paragraph[];
  /** The works its page cites, in the order the page first cites them. */
  sources: readonly SourceId[];
};

export const products: readonly Product[] = [
  {
    slug: "erp-crm",
    shelf: "products",
    name: "product_erp_crm_name",
    status: "status_in_development",
    what: "product_erp_crm_what",
    audience: "product_erp_crm_audience",
    illustration: illustrations.pacioli,
    // Own data, the exact ledger & the read-only assistant, beside both parts.
    machine: { name: "ledger", from: 0, through: "state" },
    how: [
      { text: "product_erp_crm_how_1" },
      { text: "product_erp_crm_how_2" },
      { text: "product_erp_crm_how_3" },
      { text: "product_erp_crm_how_4" },
    ],
    state: [
      // The specification's draft 2.1 and its progress review of 28 September 2026.
      { text: "product_erp_crm_state_1", values: { requirements: 120, modules: 17 } },
      { text: "product_erp_crm_state_2" },
    ],
    sources: ["twenty", "iso-4217", "iso-29148"],
  },
  {
    slug: "software-factory",
    shelf: "products",
    name: "product_software_factory_name",
    status: "status_prototype",
    what: "product_software_factory_what",
    audience: "product_software_factory_audience",
    illustration: illustrations.frege,
    // Frege's tree turns into the trace of a real requirement, drawn in his strokes.
    diagram: "trace",
    // The press, the proof & the way back to the model, beside both parts, as on every product.
    machine: { name: "mint", from: 0, through: "state" },
    how: [
      { text: "product_software_factory_how_1" },
      { text: "product_software_factory_how_2" },
      { text: "product_software_factory_how_3" },
    ],
    state: [
      {
        text: "product_software_factory_state_1",
        values: graphRuns,
      },
      { text: "product_software_factory_state_2" },
      { text: "product_software_factory_state_3" },
      { text: "product_software_factory_state_4" },
      { text: "product_software_factory_state_5" },
    ],
    sources: [
      "cpg",
      "c4",
      "iso-15288",
      "prusti",
      "verus",
      "ripgrep",
      "gsn",
      "ieee-830",
      "ieee-1016",
    ],
  },
  {
    slug: "trading-platform",
    // Research, not an offer: kept off the homepage & the product overview.
    shelf: "research",
    name: "product_trading_platform_name",
    status: "status_research",
    what: "product_trading_platform_what",
    audience: "product_trading_platform_audience",
    illustration: illustrations.playfair,
    // Many stocks in parallel, each at its own time scale, & all of it on paper: both parts.
    machine: { name: "recorder", from: 0, through: "state" },
    how: [{ text: "product_trading_platform_how_1" }, { text: "product_trading_platform_how_2" }],
    state: [
      { text: "product_trading_platform_state_1" },
      { text: "product_trading_platform_state_2" },
    ],
    sources: ["turtle"],
  },
];

/** The products on one shelf, in the order of `products`. */
export function shelved(shelf: Shelf): readonly Product[] {
  return products.filter((product) => product.shelf === shelf);
}

export type Role = {
  title: MessageId;
  /** What the role is about, then anything a candidate must know before applying. */
  intro: readonly MessageId[];
  lists: readonly { label: MessageId; items: readonly MessageId[] }[];
  /** How to apply; its `<link>` wraps the address. */
  apply: MessageId;
  subject: MessageId;
};

export const roles: readonly Role[] = [
  {
    title: "role_founding_engineer_title",
    intro: ["role_founding_engineer_focus", "role_founding_engineer_status"],
    lists: [
      {
        label: "role_founding_engineer_work_label",
        items: [
          "role_founding_engineer_work_1",
          "role_founding_engineer_work_2",
          "role_founding_engineer_work_3",
          "role_founding_engineer_work_4",
        ],
      },
      {
        label: "role_founding_engineer_profile_label",
        items: [
          "role_founding_engineer_profile_1",
          "role_founding_engineer_profile_2",
          "role_founding_engineer_profile_3",
        ],
      },
    ],
    apply: "role_founding_engineer_apply",
    subject: "role_founding_engineer_subject",
  },
  {
    title: "role_internships_title",
    intro: ["role_internships_focus"],
    lists: [
      {
        label: "role_internships_topics_label",
        items: [
          "role_internships_topic_1",
          "role_internships_topic_2",
          "role_internships_topic_3",
          "role_internships_topic_4",
        ],
      },
    ],
    apply: "role_internships_apply",
    subject: "role_internships_subject",
  },
];

/** Blog authors; a post names one of these keys in its `author` field. */
export const authors = {
  "fabian-klopfer": { name: "Fabian Klopfer" },
} as const satisfies Record<string, { name: string }>;

export type AuthorId = keyof typeof authors;

export function isAuthorId(value: string): value is AuthorId {
  return Object.hasOwn(authors, value);
}

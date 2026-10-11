import type { MessageId, Values } from "./i18n.ts";

/**
 * The site's facts and structure. Text lives in `src/locales/`: everything here that a visitor
 * reads is a message ID, except proper names, which are the same in every language.
 */

export const origin = "https://introspectum.si";
/** One address for inquiries, applications and the waiting lists. */
export const email = "fabian.klopfer@introspectum.io";

export const company = {
  name: "Introspectum",
  legalName: "Introspectum Limited",
  founder: "Fabian Klopfer",
} as const;

/** A `mailto:` link to the company address with the subject filled in. */
export function mailto(subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

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

/** Kept apart from `products` so the browser bundle can check a slug without the rest. */
export const productSlugs = ["software-factory", "erp-crm", "trading-platform"] as const;

export type ProductSlug = (typeof productSlugs)[number];

export function isProductSlug(value: string): value is ProductSlug {
  return productSlugs.some((slug) => slug === value);
}

/**
 * A paragraph of a product page: a message and the values it formats, dates at midnight UTC (see
 * `day`). Its tags cite sources by ID (see `Source`).
 */
export type Paragraph = { text: MessageId; values?: Values };

export type Product = {
  slug: ProductSlug;
  name: MessageId;
  /** Where it stands; named for language models in `llms.txt`. */
  status: MessageId;
  /** What it does, in one sentence. */
  what: MessageId;
  /** Who it is for, in one sentence. */
  audience: MessageId;
  /** The figure on its card and beside its page's opening. */
  illustration: Illustration;
  /** How it works, one paragraph each. */
  how: readonly Paragraph[];
  /** Where it stands: what works, what was measured, what is not built yet. */
  state: readonly Paragraph[];
  /** The works its page cites, in the order the page first cites them. */
  sources: readonly SourceId[];
};

export const products: readonly Product[] = [
  {
    slug: "software-factory",
    name: "product_software_factory_name",
    status: "status_prototype",
    what: "product_software_factory_what",
    audience: "product_software_factory_audience",
    illustration: illustrations.frege,
    how: [
      { text: "product_software_factory_how_1" },
      { text: "product_software_factory_how_2" },
      { text: "product_software_factory_how_3" },
    ],
    state: [
      {
        text: "product_software_factory_state_1",
        // docs/verification-logs/real-project-scale-2026-09-04.md in the product's repository.
        values: {
          date: new Date("2026-09-04T00:00:00Z"),
          ownFiles: 113,
          ownNodes: 12_801,
          ownSeconds: 4.8,
          otherFiles: 95,
          otherNodes: 20_049,
          otherSeconds: 7.3,
        },
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
    slug: "erp-crm",
    name: "product_erp_crm_name",
    status: "status_in_development",
    what: "product_erp_crm_what",
    audience: "product_erp_crm_audience",
    illustration: illustrations.pacioli,
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
    slug: "trading-platform",
    name: "product_trading_platform_name",
    status: "status_research",
    what: "product_trading_platform_what",
    audience: "product_trading_platform_audience",
    illustration: illustrations.playfair,
    how: [{ text: "product_trading_platform_how_1" }, { text: "product_trading_platform_how_2" }],
    state: [
      { text: "product_trading_platform_state_1" },
      { text: "product_trading_platform_state_2" },
    ],
    sources: ["turtle"],
  },
];

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

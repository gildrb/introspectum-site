import type { MessageId } from "./i18n.ts";

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

/** The methods, in the order the homepage lists them. */
export const methods: readonly MessageId[] = [
  "method_formal_methods",
  "method_compiler_construction",
  "method_model_based",
  "method_ai_agents",
  "method_open_data",
  "method_reinforcement_learning",
];

export const principles: readonly MessageId[] = [
  "principle_proof",
  "principle_data",
  "principle_traceability",
];

/** Kept apart from `products` so the browser bundle can check a slug without the rest. */
export const productSlugs = ["software-factory", "erp-crm", "trading-platform"] as const;

export type ProductSlug = (typeof productSlugs)[number];

export function isProductSlug(value: string): value is ProductSlug {
  return productSlugs.some((slug) => slug === value);
}

export type Product = {
  slug: ProductSlug;
  name: MessageId;
  status: MessageId;
  /** What it does, in one sentence. */
  what: MessageId;
  /** Who it is for, in one sentence. */
  audience: MessageId;
  /** The product page's text, one paragraph each. */
  details: readonly MessageId[];
  methods: readonly MessageId[];
};

export const products: readonly Product[] = [
  {
    slug: "software-factory",
    name: "product_software_factory_name",
    status: "status_prototype",
    what: "product_software_factory_what",
    audience: "product_software_factory_audience",
    details: [
      "product_software_factory_detail_1",
      "product_software_factory_detail_2",
      "product_software_factory_detail_3",
    ],
    methods: [
      "method_formal_methods",
      "method_compiler_construction",
      "method_model_based",
      "method_ai_agents",
    ],
  },
  {
    slug: "erp-crm",
    name: "product_erp_crm_name",
    status: "status_in_development",
    what: "product_erp_crm_what",
    audience: "product_erp_crm_audience",
    details: ["product_erp_crm_detail_1", "product_erp_crm_detail_2", "product_erp_crm_detail_3"],
    methods: ["method_ai_agents", "method_open_data"],
  },
  {
    slug: "trading-platform",
    name: "product_trading_platform_name",
    status: "status_research",
    what: "product_trading_platform_what",
    audience: "product_trading_platform_audience",
    details: [
      "product_trading_platform_detail_1",
      "product_trading_platform_detail_2",
      "product_trading_platform_detail_3",
    ],
    methods: ["method_reinforcement_learning"],
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

export const origin = "https://introspectum.si";
/** One address for inquiries, applications and the waiting lists. */
export const email = "mail@introspectum.si";

/**
 * Facts about the company. Every page, the feed, llms.txt and the structured data are generated
 * from this file, so a change here reaches all of them.
 */
export const company = {
  name: "Introspectum",
  legalName: "Introspectum Limited",
  founder: "Fabian Klopfer",
  /** The site's meta description. */
  description:
    "Introspectum builds software you can check: a verified software factory, an open-data ERP and CRM, and research in systematic trading.",
  mission:
    "AI writes a growing share of all code, faster than anyone can review it. We build software that is checked instead of trusted: traced from requirement to code, proven where it matters, and open to the people who answer for it.",
  who: "Introspectum Limited is registered in the Isle of Man and led by Fabian Klopfer, a computer scientist and former software engineer at IBM Germany Research & Development.",
} as const;

export const nav: readonly { label: string; href: string }[] = [
  { label: "Products", href: "/products" },
  { label: "Join us", href: "/join" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

/** A `mailto:` link to the company address with the subject filled in. */
export function mailto(subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

/** The methods, in the order the homepage names them. */
export const methods = [
  "Formal methods",
  "Compiler construction",
  "Model-based software engineering",
  "AI agents",
  "Open data",
  "Reinforcement learning",
] as const;

export type Method = (typeof methods)[number];

export const principles = [
  "proof over trust",
  "data that stays yours",
  "traceability from requirement to code",
] as const;

/** A term as it reads inside a sentence: "Formal methods" becomes "formal methods", "AI agents" keeps its capitals. */
export function inSentence(term: string): string {
  return /^[A-Z][a-z]/.test(term) ? `${term.charAt(0).toLowerCase()}${term.slice(1)}` : term;
}

/** Items as they read in a sentence: "a, b and c". */
export function listing(items: readonly string[]): string {
  const last = items[items.length - 1] ?? "";
  return items.length < 2 ? last : `${items.slice(0, -1).join(", ")} and ${last}`;
}

/** Kept apart from `products` so the browser bundle can check a slug without the product texts. */
export const productSlugs = ["software-factory", "erp-crm", "trading-platform"] as const;

export type ProductSlug = (typeof productSlugs)[number];

export function isProductSlug(value: string): value is ProductSlug {
  return productSlugs.some((slug) => slug === value);
}

export type Product = {
  slug: ProductSlug;
  name: string;
  status: "Prototype" | "In development" | "Research";
  /** What it does, in one sentence. */
  what: string;
  /** Who it is for, in one sentence that starts with "For". */
  audience: string;
  /** The product page's text, one paragraph per entry. */
  details: readonly string[];
  methods: readonly Method[];
};

export const products: readonly Product[] = [
  {
    slug: "software-factory",
    name: "Software Factory",
    status: "Prototype",
    what: "Builds one graph from your code and documents, lets AI agents work on it, and checks their changes with formal verification.",
    audience:
      "For software teams that use AI to write code and must stand behind it, starting with startups and small IT companies.",
    details: [
      "The Software Factory reads your code and its documents into one graph: requirements, design, tests, bug reports and analysis results, each linked to the code it concerns. You see the system as architecture maps, from the overview down to single functions.",
      "On top of the graph, AI agents work in steps modelled on ISO/IEC/IEEE 15288, the standard for system life cycle processes, and formal verification checks their output against your specifications. Every step leaves an audit trail.",
      "The graph and the maps work today, and verification runs end to end with the Prusti and Verus verifiers. The agent process comes next.",
    ],
    methods: [
      "Formal methods",
      "Compiler construction",
      "Model-based software engineering",
      "AI agents",
    ],
  },
  {
    slug: "erp-crm",
    // No-break spaces: the name never splits across lines.
    name: "ERP\u00a0&\u00a0CRM",
    status: "In development",
    what: "Customers, sales, accounting and HR in one open-data system, with an AI assistant that works on the same data.",
    audience:
      "For small businesses that still run on paper and spreadsheets, starting with real estate and IT services.",
    details: [
      "An ERP and CRM built on Twenty, the open-source CRM, and extended with accounting, tax, purchasing, sales, payments, inventory and HR.",
      "Each customer gets its own installation, and all data stays in open formats in one place. An AI assistant works on the same data as your team: it can keep records in order, prepare analyses and draft documents.",
      "Our own company and a real-estate brokerage are its first users.",
    ],
    methods: ["AI agents", "Open data"],
  },
  {
    slug: "trading-platform",
    name: "Trading Platform",
    status: "Research",
    what: "Runs trend-following strategies on many stocks at once, with reinforcement learning tuning each stock's settings.",
    audience:
      "For investors from real estate, banking and IT who want to test a strategy before they trust it.",
    details: [
      "The trading platform runs trend-following strategies, such as the Turtle rules, on many stocks in parallel.",
      "Reinforcement learning tunes the settings for each stock, including the time scale on which its signals are most reliable.",
      "It trades on paper only, and nothing here is investment advice.",
    ],
    methods: ["Reinforcement learning"],
  },
];

export const consulting = {
  what: "Until our products ship, we help companies bring AI into their software development and set up CRM and ERP.",
  audience: "For companies that want to use AI without losing control of their code or their data.",
  subject: "Consulting inquiry",
} as const;

/** The sentence a person agrees to when joining a product's waiting list; stored with the entry. */
export function waitlistConsent(product: Product): string {
  return `I agree that ${company.legalName} stores my email address to contact me about the ${product.name} waiting list.`;
}

export type Role = {
  slug: string;
  title: string;
  /** What the role is about, then anything a candidate must know before applying. */
  intro: readonly string[];
  lists: readonly { label: string; items: readonly string[] }[];
  apply: string;
  subject: string;
};

export const roles: readonly Role[] = [
  {
    slug: "founding-engineer",
    title: "Founding engineer",
    intro: [
      "Formal methods and code generation.",
      "We do not hire for this role yet. We read every application now and talk to exceptional people right away.",
    ],
    lists: [
      {
        label: "You would work on",
        items: [
          "Formal verification of Rust code with Prusti and Verus",
          "The agent harness that generates code from specifications",
          "Code property graphs built from existing code",
          "Connectors to GitHub and to SARIF tools",
        ],
      },
      {
        label: "We look for",
        items: [
          "A degree in computer science with a focus on systems programming",
          "Interest in compiler construction and formal methods; experience helps but is not required",
          "Fluent English",
        ],
      },
    ],
    apply: "Send your CV or LinkedIn profile and links to your work.",
    subject: "Application: founding engineer",
  },
  {
    slug: "internships",
    title: "Internships",
    intro: ["For students who want to work on a real product."],
    lists: [
      {
        label: "Topics",
        items: [
          "Formal verification and compilers",
          "AI agents",
          "ERP and CRM on Twenty",
          "Reinforcement learning for trading research",
        ],
      },
    ],
    apply: "Send your CV, the topic you want to work on and the months you are free.",
    subject: "Application: internship",
  },
];

export type Author = { name: string; role: string };

/** Blog authors; a post names one of these keys in its `author` field. */
export const authors = {
  "fabian-klopfer": { name: "Fabian Klopfer", role: "Managing Director" },
} as const satisfies Record<string, Author>;

export type AuthorId = keyof typeof authors;

export function isAuthorId(value: string): value is AuthorId {
  return Object.hasOwn(authors, value);
}

/** A page title that reads like a trail: "Introspectum → Products → ERP & CRM". */
export function title(...trail: readonly string[]): string {
  return [company.name, ...trail].join(" → ");
}

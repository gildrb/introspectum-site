/**
 * The site's languages and URLs. Kept free of the message catalogs, so the browser bundle and the
 * Worker can check a locale or build a path without loading every translation.
 */

export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

/** English is the source language: `src/locales/en.json` and `src/content/en/`. */
export const sourceLocale = "en" satisfies Locale;

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

/**
 * Per locale: the BCP 47 tag the Intl formatters use, the direction of its script, and the URL
 * prefix. The source language lives at the root, every other one below its code.
 */
export const localeInfo: Readonly<
  Record<Locale, { tag: string; dir: "ltr" | "rtl"; prefix: "" | `/${string}` }>
> = {
  en: { tag: "en-GB", dir: "ltr", prefix: "" },
  de: { tag: "de-DE", dir: "ltr", prefix: "/de" },
};

/** One value per locale, built by `make`; adding a locale makes every call site build one more. */
export function perLocale<T>(make: (locale: Locale) => T): Record<Locale, T> {
  return { en: make("en"), de: make("de") };
}

/** Each page's path segment per locale. A change breaks every link to the old path. */
const segments = {
  home: { en: "", de: "" },
  products: { en: "products", de: "produkte" },
  join: { en: "join", de: "karriere" },
  blog: { en: "blog", de: "blog" },
  about: { en: "about", de: "ueber-uns" },
  privacy: { en: "privacy", de: "datenschutz" },
  imprint: { en: "imprint", de: "impressum" },
  contact: { en: "contact", de: "kontakt" },
  joined: { en: "joined", de: "angemeldet" },
} as const satisfies Record<string, Record<Locale, string>>;

export type Route = keyof typeof segments;

/** A page's path in a locale (`/de/produkte/erp-crm`); `below` adds segments under the page. */
export function href(locale: Locale, route: Route, ...below: readonly string[]): `/${string}` {
  const parts = [localeInfo[locale].prefix.slice(1), segments[route][locale], ...below];
  return `/${parts.filter((part) => part !== "").join("/")}`;
}

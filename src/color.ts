/**
 * Every declaration of a token's CSS variable in the built stylesheet, in order: the token's own,
 * in a rule whose selector starts at `:root`, not a theme's, whose rule StyleX starts at the
 * theme's class.
 */
function declarations(css: string, variable: string): string[] {
  const name = variable.match(/^var\((--[\w-]+)\)$/)?.[1];
  if (name === undefined) throw new Error(`Not a CSS variable: ${variable}`);
  const rule = new RegExp(`(?:^|[{}])\\s*:root[^{]*\\{[^}]*?${name}:([^;}]+)`, "g");
  const values = [...css.matchAll(rule)].map(([, value = ""]) => value.trim());
  if (values.length === 0) throw new Error(`No value for ${name} in the built CSS.`);
  return values;
}

/** A token's default (dark) value: the first declaration of its variable in the built CSS. */
export function token(css: string, variable: string): string {
  const [dark = ""] = declarations(css, variable);
  return dark;
}

/**
 * A color token's two values, as `colors` declares them: the default (dark) one, then the one
 * inside the light scheme's media query.
 */
export function schemeToken(css: string, variable: string): { dark: string; light: string } {
  const values = declarations(css, variable);
  const [dark = "", light] = values;
  if (values.length !== 2 || light === undefined)
    throw new Error(
      `${variable} has ${values.length} values in the built CSS, not dark and light.`,
    );
  return { dark, light };
}

/** A linear-light sRGB channel, clamped, gamma-encoded and scaled to 0–255. */
function srgbChannel(linear: number): number {
  const clamped = Math.min(1, Math.max(0, linear));
  const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
}

/**
 * `oklch(L C H / alpha)` in sRGB, for the share image's rasterizer, which reads no OKLCH. The
 * matrices are OKLab's (Björn Ottosson, 2020), from OKLCH through linear LMS and linear sRGB.
 */
export function srgb(color: string): string {
  const match = color.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/,
  );
  if (!match) throw new Error(`Unsupported color: ${color}`);
  const [, lightness = "", lightnessPercent, chroma = "", hue = "", alpha, alphaPercent] = match;
  const l = Number(lightness) / (lightnessPercent ? 100 : 1);
  const c = Number(chroma);
  const h = (Number(hue) * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = srgbChannel(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short);
  const green = srgbChannel(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short);
  const blue = srgbChannel(-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short);
  const opacity = alpha === undefined ? 1 : Number(alpha) / (alphaPercent ? 100 : 1);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

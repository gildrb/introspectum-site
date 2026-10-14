import * as stylex from "@stylexjs/stylex";
import { useContext } from "preact/hooks";
import { type MessageId, translators } from "../i18n.ts";
import { PageAssets } from "../layout.tsx";
import type { Locale } from "../locale.ts";
import { grid, media, space } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";
import type { MachineName } from "./machines.ts";
import bookwheelSvg from "./bookwheel.svg?raw";
import ledgerSvg from "./ledger.svg?raw";
import mintSvg from "./mint.svg?raw";
import pantographSvg from "./pantograph.svg?raw";
import proofSvg from "./proof.svg?raw";
import recorderSvg from "./recorder.svg?raw";
import traceSvg from "./trace.svg?raw";

/** Each machine's drawing, built by its script in `scripts/figures/`, and its one-line caption. */
const drawings: Readonly<Record<MachineName, { svg: string; caption: MessageId }>> = {
  bookwheel: { svg: bookwheelSvg, caption: "bookwheel_caption" },
  ledger: { svg: ledgerSvg, caption: "ledger_caption" },
  mint: { svg: mintSvg, caption: "mint_caption" },
  pantograph: { svg: pantographSvg, caption: "pantograph_caption" },
  proof: { svg: proofSvg, caption: "proof_caption" },
  recorder: { svg: recorderSvg, caption: "recorder_caption" },
  trace: { svg: traceSvg, caption: "trace_caption" },
};

/**
 * A drawn machine that shows how something works (see `engraving.ts`), with a short caption.
 * Served in its rest pose; it runs on a loop while on screen, slower under the mouse and to a
 * stop while held (`live.ts`). Only the drawing changes as it runs, so nothing around it moves.
 * Its figure names the code that runs it (`modulepreload`), so the browser fetches that while the
 * drawing still arrives, alongside the page's script rather than after it.
 *
 * With `fill`, on wide screens it fills the band it stands in (`MachineSection`): drawing and
 * caption centred in it, the drawing shrunk to the band's height where it would be taller.
 */
export function Machine({
  name,
  locale,
  fill = false,
}: {
  name: MachineName;
  locale: Locale;
  fill?: boolean;
}) {
  const assets = useContext(PageAssets);
  if (assets === null) throw new Error(`The ${name} machine is drawn outside a page.`);
  const code = new Set([
    ...assets.preload("src/figures/live.ts"),
    ...assets.preload(`src/figures/${name}.ts`),
  ]);
  const { svg, caption } = drawings[name];
  return (
    <figure {...stylex.props(styles.figure, fill && styles.fill)} data-machine={name}>
      {[...code].map((url) => (
        <link key={url} rel="modulepreload" href={url} />
      ))}
      {/* The drawing is the build's own markup (`scripts/figures/engrave.mjs`). */}
      <div {...stylex.props(styles.drawing)} dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption {...stylex.props(ui.small, ui.label, styles.caption)}>
        {translators[locale].text(caption)}
      </figcaption>
    </figure>
  );
}

const styles = stylex.create({
  figure: { display: "flex", flexDirection: "column", rowGap: space.x2 },
  fill: {
    position: { default: null, [media.wide]: "absolute" },
    inset: { default: null, [media.wide]: 0 },
    justifyContent: { default: null, [media.wide]: "center" },
    alignItems: { default: null, [media.wide]: "center" },
  },
  /** The `<svg>` itself is the flex item, so it can shrink to the band. */
  drawing: { display: "contents" },
  /** Under the drawing and centred on it, as the legend under a plate in an old book. */
  caption: {
    flexShrink: 0,
    maxWidth: grid.span5Widest,
    marginInline: "auto",
    textAlign: "center",
    textWrap: "balance",
  },
});

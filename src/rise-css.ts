import { colors } from "./tokens.stylex.ts";

/**
 * The homepage's motion as served, waiting for `rise.ts`. Only the homepage carries it.
 *
 * Rising cards (`data-rise`) are out of sight until the script brings each in as the reader
 * reaches it. Titles that sweep (`data-sweep`, `Sweep`) stand in `colors.tertiary`, readable, until
 * the script turns their words to the ink one after another (`data-swept`), 60 ms apart, each over
 * 0.6 s. If the script is 3 s late (it has not marked the part `data-staged`), this sheet does it
 * itself: cards rise as the script's do (1 s on CSS `ease`, out of a 10px blur), 150 ms apart in
 * their row, figures at their real values; titles turn to the ink. Without JavaScript
 * (`noscriptCss`), with reduced motion and in print, both stand there from the start.
 */
export const riseCss = `
@keyframes rise{from{opacity:0;transform:translateY(16px);filter:blur(10px)}to{opacity:1;transform:none;filter:none}}
@keyframes sweep{to{color:${colors.primary}}}
[data-rise]{animation:rise 1s cubic-bezier(0.25,0.1,0.25,1) 3000ms both}
[data-rise]:nth-child(2){animation-delay:3150ms}
[data-rise]:nth-child(3){animation-delay:3300ms}
[data-rise]:nth-child(n+4){animation-delay:3450ms}
[data-sweep]>span{color:${colors.tertiary}}
[data-sweep]:not([data-staged])>span{animation:sweep .6s ease calc(3s + var(--word) * 60ms) forwards}
[data-sweep][data-swept]>span{color:${colors.primary};transition:color .6s ease calc(var(--word) * 60ms)}
@media (prefers-reduced-motion:reduce),print{[data-rise]{animation:none}[data-sweep]>span{color:${colors.primary};animation:none;transition:none}}
`;

/** Without JavaScript the cards & titles stand there from the start. */
export const noscriptCss = `[data-rise]{animation:none}[data-sweep]>span{color:${colors.primary};animation:none}`;

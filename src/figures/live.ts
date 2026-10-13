import type { Projection } from "./projection.ts";

/**
 * A drawn machine's motion: model time runs from 0 to `length` and starts again, and `draw`
 * redraws the live parts for a moment of it. The page is served in the pose at `rest`.
 */
export type Machine = {
  /** Model time of one cycle. */
  length: number;
  /** Model time per second while it runs. */
  rate: number;
  /** The moment the page shows before anything moves. */
  rest: number;
  /** Binds the drawing; the returned function draws moment `t` of cycle `cycle` (0 at load). */
  bind(svg: SVGSVGElement, P: Projection): (t: number, cycle: number) => void;
};

/** A number the build wrote into an attribute of the drawing (`scripts/figures/engrave.mjs`). */
function numberOf(element: Element, name: string): number {
  const value = Number(element.getAttribute(name) ?? Number.NaN);
  if (!Number.isFinite(value)) throw new Error(`The figure has no number in ${name}.`);
  return value;
}

/** The camera the build drew the figure with, from the attributes it wrote on the `<svg>`. */
export function projectionOf(svg: Element): Projection {
  return {
    origin: [numberOf(svg, "data-origin-x"), numberOf(svg, "data-origin-y")],
    scale: numberOf(svg, "data-scale"),
    azimuth: numberOf(svg, "data-azimuth"),
    elevation: numberOf(svg, "data-elevation"),
  };
}

/** How quickly a machine eases to a new speed, in seconds: it never jumps. */
const ease = 0.45;
/** Its speed while the pointer rests on it, to follow a step, and while it is held. */
const slow = 0.35;
const held = 0;

/**
 * Runs a machine on a loop while it is on screen, from its rest pose, always forwards. The reader
 * never moves it, only its pace: with the pointer on it, it eases to a slower pace, to follow a
 * step; held down, it eases to a stop, to look; let go, it eases back. Only its own drawing
 * changes, so nothing on the page moves with it. With reduced motion it stays still.
 */
export function run(figure: HTMLElement, machine: Machine) {
  const svg = figure.querySelector("svg");
  if (svg === null) throw new Error("The figure has no drawing.");
  const draw = machine.bind(svg, projectionOf(svg));
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let time = machine.rest;
  let speed = 1;
  let hovered = false;
  let pressed = false;
  let seen = false;
  let frame = 0;
  let last = 0;

  function tick(now: number) {
    const dt = last === 0 ? 1 / 60 : Math.min((now - last) / 1000, 1 / 20);
    last = now;
    const target = pressed ? held : hovered ? slow : 1;
    speed += (target - speed) * (1 - Math.exp(-dt / ease));
    // Eased to a stop, it stops: a crawl too slow to see would still redraw every frame.
    if (target === held && speed < 0.005) speed = held;
    time += machine.rate * speed * dt;
    const cycle = Math.floor(time / machine.length);
    draw(time - cycle * machine.length, cycle);
    frame = seen && !still.matches ? requestAnimationFrame(tick) : 0;
  }

  new IntersectionObserver(
    (entries) => {
      seen = entries.some((entry) => entry.isIntersecting);
      if (seen && !still.matches && frame === 0) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    },
    { threshold: 0.25 },
  ).observe(svg);

  svg.addEventListener("pointerenter", () => {
    hovered = true;
  });
  svg.addEventListener("pointerleave", () => {
    hovered = false;
    pressed = false;
  });
  svg.addEventListener("pointerdown", () => {
    pressed = true;
  });
  const release = () => {
    pressed = false;
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);
}

import type { CSSProperties } from "react"

import { ArrowRight, ChevronRight } from "lucide-react"

import { Button } from "~/core"
import { cn } from "~/utils/cn"

const ASSETS = "/assets/home-study-2026-10-06"

/**
 * The window onto the Figma canvas (553 x 600) each card shows: the same
 * size for both, so the drawings keep one scale, but starting where each
 * drawing starts, so both sit the same gap under their title.
 */
const BAND = { x: 48, width: 479, height: 387 }
const BAND_TOP = { restock: 177, manual: 205 }

/** Figma 7864:46803: original individual illustration layers and positions. */
const RESTOCK_LAYERS: {
  file: string
  style: CSSProperties
  masked?: boolean
}[] = [
  { file: "rs-arm.svg", style: layer(83.635, 79.025, 102.71, 84.7193, -25) },
  { file: "rs-hand.svg", style: layer(77.215, 76.835, 70, 64) },
  { file: "rs-bottle.svg", style: layer(22.635, 61.57, 124.333, 384.863) },
  {
    file: "rs-beam.svg",
    style: layer(40.035, 68.94, 115.559, 139.806, -77.38, -2.9),
  },
  {
    file: "rs-scanner.svg",
    style: layer(68.235, 76.13, 64.6441, 188.781, -77.3, -2.72),
  },
  {
    file: "rs-scanner-dark.svg",
    style: layer(68.235, 76.13, 64.6441, 188.781, -77.3, -2.72),
    masked: true,
  },
  {
    file: "rs-trigger.svg",
    style: layer(63.865, 75.05, 27.987, 28.8192, -32.57, -3.15),
  },
  {
    file: "rs-trigger-inner.svg",
    style: layer(63.865, 75.05, 13.911, 13.4854, -77.38, -2.91),
  },
  { file: "rs-thumb.svg", style: layer(73.66, 73.58, 30.8961, 17.543, -78) },
  ...[70.82, 73.62, 76.425, 79.23].map((x, index) => ({
    file: "rs-finger.svg",
    style: layer(x, 79.865 + index * 0.835, 44.4905, 18.0396, -78.48, -6.36),
  })),
]

/** Static Figma illustration coordinates, independent from product/UI sizing. */
function layer(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0,
  skew = 0
): CSSProperties {
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${(width / 553) * 100}%`,
    height: `${(height / 600) * 100}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg) skewX(${skew}deg)`,
  }
}

/**
 * Study (`?card=1`..`10`): ways to make the card read as a button, after
 * staff said it did not look pressable. 0 is the card as it was.
 * 1 a key's deeper bottom edge · 2 a soft shadow · 3 an arrow in a circle,
 * top right · 4 a "start" pill, bottom right · 5 a "tap to start" strip ·
 * 6 an arrow after the title · 7 a darker outline · 8 the title on a white
 * footer · 9 an outline in the action colour · 10 edge, shadow and arrow.
 */
export type CardStyle = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export function HomeObjectAction({
  kind,
  label,
  inProgress,
  disabled,
  onClick,
  cardStyle = 0,
  startLabel = "",
}: {
  kind: "restock" | "manual"
  label: string
  inProgress?: string
  disabled: boolean
  onClick: () => void
  cardStyle?: CardStyle
  /** The words on the start pill or strip (styles 4 and 5). */
  startLabel?: string
}) {
  const footerTitle = cardStyle === 8
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        // The same outline as every other button on Home, so the cards read as
        // buttons too (staff said they did not).
        "relative size-full min-h-64 min-w-0 flex-col items-start justify-start overflow-hidden rounded-lg border-2 border-black/20 text-left whitespace-normal text-primary lg:min-h-56",
        kind === "restock" ? "bg-home-restock" : "bg-home-manual",
        (cardStyle === 1 || cardStyle === 10) &&
          "border-b-6 border-black/25 active:translate-y-0.5 active:border-b-2",
        (cardStyle === 2 || cardStyle === 10) &&
          "shadow-[0_2px_4px_rgb(0_0_0/0.08),0_8px_20px_rgb(0_0_0/0.10)] active:shadow-none",
        cardStyle === 7 && "border-black/30",
        cardStyle === 9 && "ring-3 ring-primary ring-inset"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none relative min-h-0 w-full flex-1 overflow-hidden",
          // 24 px under the title, or 16 px under the in-progress tag.
          inProgress ? "mt-4" : "mt-6",
          // The restock drawing runs to its window's bottom: keep it off the card edge.
          kind === "restock" && "mb-2"
        )}
      >
        {/* The part of the Figma canvas (553 x 600) both illustrations cover,
            x 48-527, from where each drawing starts, scaled uniformly to fit the card, centred
            and top-aligned, so the drawing starts right at the gap above.
            Plain CSS, not an SVG foreignObject: iPad Safari does not draw
            positioned HTML inside a foreignObject. */}
        <span className="@container-size absolute inset-0">
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 overflow-hidden"
            style={{
              width: `min(100cqw, 100cqh * ${BAND.width} / ${BAND.height})`,
              aspectRatio: `${BAND.width} / ${BAND.height}`,
            }}
          >
            <span
              className="absolute"
              style={{
                left: `${(-BAND.x / BAND.width) * 100}%`,
                top: `${(-BAND_TOP[kind] / BAND.height) * 100}%`,
                width: `${(553 / BAND.width) * 100}%`,
                height: `${(600 / BAND.height) * 100}%`,
              }}
            >
              <span className="relative block size-full">
                {kind === "restock" ? (
                  RESTOCK_LAYERS.map(({ file, style, masked }, index) =>
                    masked ? (
                      <span
                        key={`${file}-${index}`}
                        className="absolute"
                        style={{
                          ...style,
                          maskImage: `url(${ASSETS}/rs-scanner-mask.svg)`,
                          maskSize: "100% 100%",
                          maskRepeat: "no-repeat",
                        }}
                      >
                        <img
                          src={`${ASSETS}/${file}`}
                          alt=""
                          draggable={false}
                          className="absolute"
                          style={{
                            left: 0,
                            top: 0,
                            width: "102.4106%",
                            height: "55.9622%",
                            transformOrigin: "0 0",
                            transform:
                              "translate(-1.7494%, -0.0613%) matrix(0.999783, -0.004363, -0.00525, 1.00024, 0, 0)",
                          }}
                        />
                      </span>
                    ) : (
                      <img
                        key={`${file}-${index}`}
                        src={`${ASSETS}/${file}`}
                        alt=""
                        draggable={false}
                        className="absolute"
                        style={style}
                      />
                    )
                  )
                ) : (
                  <img
                    src={`${ASSETS}/manual.png`}
                    alt=""
                    draggable={false}
                    className="absolute h-auto"
                    style={{ left: "8.68%", top: "34.2%", width: "84.81%" }}
                  />
                )}
              </span>
            </span>
          </span>
        </span>
      </span>
      <span
        className={cn(
          "relative order-first flex w-full min-w-0 shrink-0 flex-col items-start px-4 pt-4 lg:px-5 lg:pt-5",
          footerTitle && "hidden"
        )}
      >
        <span className="flex items-center gap-2 text-[2rem]/tight font-bold">
          {label}
          {cardStyle === 6 && (
            <ArrowRight aria-hidden="true" className="size-8 shrink-0" />
          )}
        </span>
        {inProgress && (
          <span className="mt-2 inline-flex items-center gap-2.5 rounded-full bg-default px-5 py-2 text-xl font-bold text-primary">
            <span className="size-3.5 animate-pulse rounded-full bg-success" />
            {inProgress}
          </span>
        )}
      </span>
      {/* An unfinished task: a deeper card edge that pulses with the tag's dot.
          A separate layer so only the edge fades, not the card content. */}
      {inProgress && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 animate-pulse rounded-lg ring-6 ring-inset",
            kind === "restock" ? "ring-home-restock" : "ring-home-manual"
          )}
        />
      )}
      {(cardStyle === 3 || cardStyle === 10) && (
        <span
          aria-hidden="true"
          className="absolute top-4 right-4 grid size-12 place-items-center rounded-full bg-default shadow-[0_1px_3px_rgb(0_0_0/0.15)]"
        >
          <ChevronRight className="size-7" />
        </span>
      )}
      {cardStyle === 4 && (
        <span
          aria-hidden="true"
          className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full bg-inverse px-5 py-3 text-lg font-bold text-inverse"
        >
          {startLabel}
          <ArrowRight className="size-5" />
        </span>
      )}
      {cardStyle === 5 && (
        <span
          aria-hidden="true"
          className="flex w-full shrink-0 items-center justify-center gap-2 bg-black/10 py-3 text-lg font-bold"
        >
          {startLabel}
          <ArrowRight className="size-5" />
        </span>
      )}
      {footerTitle && (
        <span className="flex w-full shrink-0 items-center gap-2 bg-default px-5 py-4">
          <span className="flex-1 text-[1.75rem]/tight font-bold">{label}</span>
          <ChevronRight aria-hidden="true" className="size-7 shrink-0" />
        </span>
      )}
    </Button>
  )
}

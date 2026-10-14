import type { CSSProperties } from "react"

import { Button } from "~/core"
import { cn } from "~/utils/cn"

const ASSETS = "/assets/home-study-2026-10-06"

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

export function HomeObjectAction({
  kind,
  label,
  inProgress,
  disabled,
  onClick,
}: {
  kind: "restock" | "manual"
  label: string
  inProgress?: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative size-full min-h-64 min-w-0 flex-col items-start justify-start overflow-hidden rounded-lg border-0 text-left whitespace-normal text-primary lg:min-h-56",
        kind === "restock" ? "bg-home-restock" : "bg-home-manual"
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none relative min-h-0 w-full flex-1 overflow-hidden"
      >
        {/* Scale the entire Figma canvas uniformly; clamping only its width
            distorts percentage-positioned layers in tall cards. */}
        <svg
          className="absolute inset-0 size-full"
          viewBox="0 160 553 440"
          preserveAspectRatio="xMidYMin meet"
          focusable="false"
        >
          <foreignObject width={553} height={600}>
            <div className="relative size-full">
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
            </div>
          </foreignObject>
        </svg>
      </span>
      <span className="relative order-first flex w-full min-w-0 shrink-0 flex-col items-start px-4 pt-4 lg:px-5 lg:pt-5">
        <span className="text-xl/tight font-bold">{label}</span>
        {/* The tag's row is always kept, so the illustration below stays the
            same size whether or not a task is open. */}
        <span
          aria-hidden={!inProgress}
          className={cn(
            "mt-2 inline-flex items-center gap-2 rounded-full bg-default px-4 py-2 text-base font-bold text-primary",
            !inProgress && "invisible"
          )}
        >
          <span className="size-3 animate-pulse rounded-full bg-success" />
          {inProgress ?? "\u00a0"}
        </span>
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
    </Button>
  )
}

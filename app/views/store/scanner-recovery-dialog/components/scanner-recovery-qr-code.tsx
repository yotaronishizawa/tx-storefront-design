// 21×21 QR modules for the scanner command in the aria-label, drawn inside a 4-module quiet zone.
const SCANNER_RECOVERY_QR_ROWS = [
  "111111101011101111111",
  "100000100011001000001",
  "101110101101001011101",
  "101110101100101011101",
  "101110101001001011101",
  "100000100111101000001",
  "111111101010101111111",
  "000000000001100000000",
  "111100101111110011101",
  "001010000101111101101",
  "000110110011000001101",
  "111001001001001000011",
  "101011110110100011011",
  "000000001001001101011",
  "111111100111100110000",
  "100000100000000110111",
  "101110100010111100111",
  "101110101111001000010",
  "101110101100101100100",
  "100000101010010011001",
  "111111101000010011100",
]

const QUIET_ZONE = 4

const DARK_MODULES = SCANNER_RECOVERY_QR_ROWS.flatMap((row, y) =>
  Array.from(row).flatMap((cell, x) => (cell === "1" ? [{ x, y }] : []))
)

export function ScannerRecoveryQrCode() {
  return (
    <svg
      aria-label="^&002&^"
      className="size-58"
      role="img"
      shapeRendering="crispEdges"
      viewBox="0 0 29 29"
    >
      <rect height="29" width="29" fill="white" />
      {DARK_MODULES.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          height="1"
          width="1"
          x={x + QUIET_ZONE}
          y={y + QUIET_ZONE}
          fill="black"
        />
      ))}
    </svg>
  )
}

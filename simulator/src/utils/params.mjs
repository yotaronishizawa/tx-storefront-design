/** An integer query parameter; missing, empty or non-integer reads as `fallback`. */
export function readIntParam(params, name, fallback) {
  const value = Number(params.get(name) || Number.NaN)
  return Number.isInteger(value) ? value : fallback
}

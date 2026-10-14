/**
 * Caches the last call, returning the same result for the same arguments by
 * reference. A store selector deriving a new array on every call would
 * otherwise re-render its subscriber on any state change.
 */
export function memoizeOne<Args extends unknown[], Result>(
  compute: (...args: Args) => Result
): (...args: Args) => Result {
  let lastArgs: Args | null = null
  let lastResult: Result

  return (...args: Args): Result => {
    const isSameCall =
      lastArgs !== null &&
      lastArgs.length === args.length &&
      lastArgs.every((argument, index) => argument === args[index])
    if (isSameCall) {
      return lastResult
    }

    lastArgs = args
    lastResult = compute(...args)
    return lastResult
  }
}

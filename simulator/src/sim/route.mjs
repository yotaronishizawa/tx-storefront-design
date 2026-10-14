/**
 * One `/sim/*` scenario helper. `handler` takes the query string
 * (`URLSearchParams`) and returns the JSON body; a body with `ok: false`
 * answers `400`.
 */
export const get = (path, handler) => ({ method: "GET", path, handler })
export const post = (path, handler) => ({ method: "POST", path, handler })

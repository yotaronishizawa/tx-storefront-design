/**
 * Every popup has a title (Ethan's popup: title, then the body). Messages are
 * written "title\nbody": the first line is what is happening or asked, the
 * rest explains. A one-line message is a title alone.
 */
export function splitTitle(message: string): { title: string; body: string } {
  const [title = "", ...rest] = message.split("\n")
  return { title, body: rest.join("\n").trim() }
}

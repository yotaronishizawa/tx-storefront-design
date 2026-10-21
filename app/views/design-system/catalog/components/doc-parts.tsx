import type { ReactNode } from "react"

import { Check, X } from "lucide-react"

import { cn } from "~/utils/cn"

import { useDocText, type DocText } from "./doc-lang"

/** One entry of the catalog: a foundation or a component. */
export function DocSection({
  id,
  title,
  lead,
  importLine,
  children,
}: {
  id: string
  title: DocText
  /** One or two sentences: what it is for. */
  lead: DocText
  /** How to import it, for components. */
  importLine?: string
  children: ReactNode
}) {
  const tx = useDocText()
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-display/tight font-bold">{tx(title)}</h2>
        <p className="max-w-3xl text-lg text-secondary">{tx(lead)}</p>
        {importLine && (
          <code className="self-start rounded-md bg-subtle px-3 py-1.5 font-mono text-sm">
            {importLine}
          </code>
        )}
      </header>
      {children}
    </section>
  )
}

export function SubTitle({ children }: { children: DocText }) {
  const tx = useDocText()
  return <h3 className="text-xl font-bold">{tx(children)}</h3>
}

/** When to reach for it, and when to reach for something else. */
export function UseWhen({ dos, donts }: { dos: DocText[]; donts: DocText[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <List tone="do" items={dos} />
      <List tone="dont" items={donts} />
    </div>
  )
}

function List({ tone, items }: { tone: "do" | "dont"; items: DocText[] }) {
  const tx = useDocText()
  const Icon = tone === "do" ? Check : X
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border-t-4 bg-default p-5",
        tone === "do" ? "border-success" : "border-error"
      )}
    >
      <p className="font-bold">
        {tx(
          tone === "do"
            ? { en: "Use it when", ja: "使う時" }
            : { en: "Not for", ja: "使わない時" }
        )}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={tx(item)} className="flex items-start gap-2 text-base">
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-1 size-4 shrink-0",
                tone === "do" ? "text-success" : "text-error"
              )}
            />
            {tx(item)}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A live example on a canvas, its name, and the code that makes it. */
export function Example({
  label,
  note,
  code,
  children,
  canvas = "subtle",
}: {
  label: DocText
  note?: DocText
  code: string
  children: ReactNode
  canvas?: "subtle" | "default"
}) {
  const tx = useDocText()
  return (
    <figure className="flex flex-col overflow-hidden rounded-lg border border-default bg-default">
      <figcaption className="flex flex-col gap-0.5 border-b border-default px-5 py-3">
        <span className="font-bold">{tx(label)}</span>
        {note && <span className="text-sm text-secondary">{tx(note)}</span>}
      </figcaption>
      <div
        className={cn(
          "flex flex-wrap items-start gap-4 p-6",
          canvas === "subtle" ? "bg-subtle" : "bg-default"
        )}
      >
        {children}
      </div>
      <pre className="overflow-x-auto border-t border-default bg-inverse px-5 py-4 font-mono text-xs/relaxed text-inverse select-text">
        {code}
      </pre>
    </figure>
  )
}

export type PropRow = {
  name: string
  type: string
  defaultValue?: string
  description: DocText
}

export function PropsTable({ rows }: { rows: PropRow[] }) {
  const tx = useDocText()
  return (
    <div className="overflow-hidden rounded-lg border border-default bg-default">
      <table className="w-full text-left text-sm">
        <thead className="bg-subtle text-secondary">
          <tr>
            <th className="px-4 py-2 font-bold">Prop</th>
            <th className="px-4 py-2 font-bold">
              {tx({ en: "Type", ja: "型" })}
            </th>
            <th className="px-4 py-2 font-bold">
              {tx({ en: "Default", ja: "初期値" })}
            </th>
            <th className="px-4 py-2 font-bold">
              {tx({ en: "What it does", ja: "役割" })}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-default align-top">
              <td className="px-4 py-2 font-mono font-bold">{row.name}</td>
              <td className="px-4 py-2 font-mono text-secondary">{row.type}</td>
              <td className="px-4 py-2 font-mono text-secondary">
                {row.defaultValue ?? "—"}
              </td>
              <td className="px-4 py-2">{tx(row.description)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

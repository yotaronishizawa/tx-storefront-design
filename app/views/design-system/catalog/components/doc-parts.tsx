import type { ReactNode } from "react"

import { Check, X } from "lucide-react"

import { cn } from "~/utils/cn"

/** One entry of the catalog: a foundation or a component. */
export function DocSection({
  id,
  title,
  lead,
  importLine,
  children,
}: {
  id: string
  title: string
  /** One or two sentences: what it is for. */
  lead: string
  /** How to import it, for components. */
  importLine?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-display/tight font-bold">{title}</h2>
        <p className="max-w-3xl text-lg text-secondary">{lead}</p>
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

export function SubTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-xl font-bold">{children}</h3>
}

/** When to reach for it, and when to reach for something else. */
export function UseWhen({ dos, donts }: { dos: string[]; donts: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <List tone="do" items={dos} />
      <List tone="dont" items={donts} />
    </div>
  )
}

function List({ tone, items }: { tone: "do" | "dont"; items: string[] }) {
  const Icon = tone === "do" ? Check : X
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border-t-4 bg-default p-5",
        tone === "do" ? "border-success" : "border-error"
      )}
    >
      <p className="font-bold">{tone === "do" ? "Use it when" : "Not for"}</p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-base">
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-1 size-4 shrink-0",
                tone === "do" ? "text-success" : "text-error"
              )}
            />
            {item}
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
  label: string
  note?: string
  code: string
  children: ReactNode
  canvas?: "subtle" | "default"
}) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-lg border border-default bg-default">
      <figcaption className="flex flex-col gap-0.5 border-b border-default px-5 py-3">
        <span className="font-bold">{label}</span>
        {note && <span className="text-sm text-secondary">{note}</span>}
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
  description: string
}

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-default bg-default">
      <table className="w-full text-left text-sm">
        <thead className="bg-subtle text-secondary">
          <tr>
            <th className="px-4 py-2 font-bold">Prop</th>
            <th className="px-4 py-2 font-bold">Type</th>
            <th className="px-4 py-2 font-bold">Default</th>
            <th className="px-4 py-2 font-bold">What it does</th>
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
              <td className="px-4 py-2">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

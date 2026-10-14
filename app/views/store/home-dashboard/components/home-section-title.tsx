export function HomeSectionTitle({ title }: { title: string }) {
  return (
    <h2 className="min-w-0 truncate border-l-4 border-primary pl-2 text-xl/tight font-bold tracking-normal [@media(max-height:900px)]:text-lg">
      {title}
    </h2>
  )
}

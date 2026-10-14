import type { PromptPhoto } from "~/types/action-prompt"

export function PromptPhotos({ photos }: { photos: readonly PromptPhoto[] }) {
  return (
    <div className="grid grid-flow-col gap-3">
      {photos.map((photo) => (
        <img
          key={photo.src}
          alt={photo.alt}
          className="aspect-square w-full rounded-md object-cover"
          draggable={false}
          src={photo.src}
        />
      ))}
    </div>
  )
}

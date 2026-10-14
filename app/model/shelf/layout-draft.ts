import type { ShelfLocation } from "./lane-update"

/** The layout editor's unsaved work, kept per store so a reload does not lose it. */
export type LayoutDraft = {
  /** `layoutSignature` of the layout the edits started from. */
  baseSignature: string
  facesChanged: boolean
  locations: ShelfLocation[]
  needRobotCapture: boolean
  savedAt: number
}

/** Where the editor keeps its offline draft for the current store. */
export type LayoutDraftStorage = {
  read: () => LayoutDraft | null
  save: (draft: LayoutDraft) => boolean
  clear: () => void
}

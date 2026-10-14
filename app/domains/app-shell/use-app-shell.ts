import type { BusyAction } from "~/types/busy-action"
import type { VideoTutorialCategory } from "~/utils/video-tutorials"

import {
  selectMessage,
  selectShellIdle,
  useAppShellStore,
  type ActionPrompt,
  type DialogKind,
  type OpmConnection,
} from "./app-shell-store"

// One hook per slice, so a busy-flag change does not re-render a dialog and vice versa.
export function useBusyAction(): BusyAction {
  return useAppShellStore((state) => state.busyAction)
}

export function useShellMessage(): string {
  return useAppShellStore(selectMessage)
}

export function useActiveDialog(): DialogKind | null {
  return useAppShellStore((state) => state.activeDialog)
}

/** True while `dialog` is the one showing — for a button that reflects it. */
export function useIsDialogOpen(dialog: DialogKind): boolean {
  return useAppShellStore((state) => state.activeDialog === dialog)
}

export function useOpenDialog(): (dialog: DialogKind) => void {
  return useAppShellStore((state) => state.openDialog)
}

export function useOpenVideoTutorial(): (
  category: VideoTutorialCategory
) => void {
  return useAppShellStore((state) => state.openVideoTutorial)
}

export function useVideoTutorialCategory(): VideoTutorialCategory {
  return useAppShellStore((state) => state.videoTutorialCategory)
}

export function useActionPrompt(): ActionPrompt | null {
  return useAppShellStore((state) => state.prompt)
}

export function useOpmConnection(): OpmConnection {
  return useAppShellStore((state) => state.opmConnection)
}

/** True while nothing is on screen or running that a reload or background prompt would interrupt. */
export function useShellIdle(): boolean {
  return useAppShellStore(selectShellIdle)
}

export function useAppUpdateReady(): boolean {
  return useAppShellStore((state) => state.updateReady)
}

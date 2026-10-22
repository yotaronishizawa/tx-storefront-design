import { create } from "zustand"

import type {
  ActionPrompt,
  PromptButtons,
  PromptChoice,
  PromptPhoto,
} from "~/types/action-prompt"
import type { BusyAction } from "~/types/busy-action"
import type { VideoTutorialCategory } from "~/utils/video-tutorials"

export type { ActionPrompt, PromptButtons, PromptChoice, PromptPhoto }

/**
 * The one full-screen dialog the operator opened; they are mutually exclusive.
 * The `pending*` fields stay separate because effects set them, and must not
 * replace a dialog the operator is reading.
 */
export type DialogKind =
  | "display-source-blocked"
  | "display-source-not-enough"
  | "manual-finish"
  | "manual-finish-next"
  | "manual-layout-block"
  | "manual-start"
  | "restocking-layout-block"
  | "restocking-end"
  | "restocking-end-next"
  | "restocking-start"
  | "scanner-recovery"
  | "scanner-help"
  | "robot-power"
  | "teleoperation-layout-block"
  | "video-tutorial"

type PendingPrompt = ActionPrompt & { resolve: (choice: PromptChoice) => void }

/** `connecting` blocks the screen after a drop; `failed` also offers a manual reconnect. */
export type OpmConnection = "connected" | "connecting" | "failed"

/** What the shell is showing: busy action, banner, dialogs. A store so a dialog survives navigation. */
type AppShellState = {
  activeDialog: DialogKind | null
  /** Empty when idle, otherwise the key of the action being awaited. */
  busyAction: BusyAction
  dismissedManualTaskPromptId: string
  error: string
  notice: string
  opmConnection: OpmConnection
  /**
   * Popups other domains show outside the shell (the lane-error popup, scan
   * alerts), by key, so a background prompt waits for them too.
   */
  overlays: Readonly<Record<string, boolean>>
  pendingManualTaskPromptId: string
  prompt: PendingPrompt | null
  /** A new build has installed and waits for a reload. Outlives sign-out. */
  updateReady: boolean
  /** Which video the tutorial dialog opens on. */
  videoTutorialCategory: VideoTutorialCategory
}

type AppShellActions = {
  answerPrompt: (choice: PromptChoice) => void
  /** Shows `prompt` over whatever is open and resolves with the operator's answer. */
  askOperator: (prompt: ActionPrompt) => Promise<PromptChoice>
  /**
   * The same for a prompt nobody tapped for, e.g. a poll's: it waits until no
   * dialog, prompt, banner or command is showing, so it never replaces one.
   * `onShow` runs as it appears. Sign-out or an aborted signal answers "dismiss".
   */
  askOperatorWhenIdle: (
    prompt: ActionPrompt,
    onShow?: () => void,
    signal?: AbortSignal
  ) => Promise<PromptChoice>
  clearDismissedManualTaskPrompt: () => void
  clearMessage: () => void
  /** Pass `dialog` to close it only if it is still showing, so a late action cannot close a newer one. */
  closeDialog: (dialog?: DialogKind) => void
  /** Remembers the prompt so it is not re-offered, and clears it from view. */
  dismissManualTaskPrompt: () => void
  /** The same, for a task the operator left before it was offered. */
  dismissManualTaskPromptFor: (promptId: string) => void
  openDialog: (dialog: DialogKind) => void
  openVideoTutorial: (category: VideoTutorialCategory) => void
  setBusyAction: (busyAction: BusyAction) => void
  setError: (error: string) => void
  setNotice: (notice: string) => void
  setOpmConnection: (opmConnection: OpmConnection) => void
  setOverlayShowing: (key: string, showing: boolean) => void
  setPendingManualTaskPromptId: (promptId: string) => void
  setUpdateReady: (updateReady: boolean) => void
}

const INITIAL_STATE: AppShellState = {
  activeDialog: null,
  busyAction: "",
  dismissedManualTaskPromptId: "",
  error: "",
  notice: "",
  opmConnection: "connected",
  overlays: {},
  pendingManualTaskPromptId: "",
  prompt: null,
  updateReady: false,
  videoTutorialCategory: "InitialPage",
}

export const useAppShellStore = create<AppShellState & AppShellActions>(
  (set, get) => ({
    ...INITIAL_STATE,

    answerPrompt: (choice) => {
      const { prompt } = get()
      set({ prompt: null })
      prompt?.resolve(choice)
    },
    askOperator: (prompt) =>
      new Promise((resolve) => {
        // A prompt still open is answered for the operator rather than orphaned.
        get().prompt?.resolve("dismiss")
        set({ prompt: { ...prompt, resolve } })
      }),
    askOperatorWhenIdle: (prompt, onShow, signal) =>
      new Promise((resolve) => {
        let shown: PendingPrompt | null = null
        const settle = (choice: PromptChoice) => {
          signal?.removeEventListener("abort", abort)
          resolve(choice)
        }
        const waiter = { unsubscribe: () => {}, resolve: settle }
        function abort() {
          waiter.unsubscribe()
          idleWaiters.delete(waiter)
          if (shown && get().prompt === shown) get().answerPrompt("dismiss")
          else settle("dismiss")
        }
        const showIfIdle = () => {
          if (signal?.aborted) {
            abort()
            return
          }
          const state = get()
          if (!selectShellIdle(state)) return
          waiter.unsubscribe()
          idleWaiters.delete(waiter)
          void state.askOperator(prompt).then(settle)
          shown = get().prompt
          onShow?.()
        }
        if (signal?.aborted) {
          settle("dismiss")
          return
        }
        signal?.addEventListener("abort", abort, { once: true })
        idleWaiters.add(waiter)
        waiter.unsubscribe = useAppShellStore.subscribe(showIfIdle)
        showIfIdle()
      }),

    clearDismissedManualTaskPrompt: () =>
      set({ dismissedManualTaskPromptId: "" }),
    clearMessage: () => set({ error: "", notice: "" }),
    closeDialog: (dialog) => {
      if (dialog && get().activeDialog !== dialog) {
        return
      }
      set({ activeDialog: null })
    },
    dismissManualTaskPrompt: () =>
      set((state) => ({
        dismissedManualTaskPromptId: state.pendingManualTaskPromptId,
        pendingManualTaskPromptId: "",
      })),
    dismissManualTaskPromptFor: (promptId) =>
      set({
        dismissedManualTaskPromptId: promptId,
        pendingManualTaskPromptId: "",
      }),
    openDialog: (activeDialog) => set({ activeDialog }),
    openVideoTutorial: (videoTutorialCategory) =>
      set({ activeDialog: "video-tutorial", videoTutorialCategory }),
    setBusyAction: (busyAction) => set({ busyAction }),
    setError: (error) => set({ error }),
    setNotice: (notice) => set({ notice }),
    setOpmConnection: (opmConnection) => set({ opmConnection }),
    setOverlayShowing: (key, showing) =>
      set((state) =>
        Boolean(state.overlays[key]) === showing
          ? state
          : { overlays: { ...state.overlays, [key]: showing } }
      ),
    setPendingManualTaskPromptId: (pendingManualTaskPromptId) =>
      set({ pendingManualTaskPromptId }),
    setUpdateReady: (updateReady) => set({ updateReady }),
  })
)

type IdleWaiter = {
  unsubscribe: () => void
  resolve: (choice: PromptChoice) => void
}

const idleWaiters = new Set<IdleWaiter>()

/** Nothing on screen or running that a background prompt would interrupt. */
export function selectShellIdle(state: AppShellState): boolean {
  return (
    !state.prompt &&
    !state.activeDialog &&
    !state.busyAction &&
    !state.error &&
    !state.notice &&
    state.opmConnection === "connected" &&
    !Object.values(state.overlays).some(Boolean) &&
    !state.pendingManualTaskPromptId
  )
}

/** One banner slot: an error wins over a notice. */
export function selectMessage(state: AppShellState): string {
  return state.error || state.notice
}

/** Non-reactive read, for effects and actions that need the value at call time. */
export function readAppShellState(): AppShellState & AppShellActions {
  return useAppShellStore.getState()
}

export function resetAppShellStore() {
  // Settle an open prompt first, so the action waiting on it ends instead of hanging.
  useAppShellStore.getState().prompt?.resolve("dismiss")
  for (const waiter of idleWaiters) {
    waiter.unsubscribe()
    waiter.resolve("dismiss")
  }
  idleWaiters.clear()
  // The waiting build is the device's, not the operator's.
  useAppShellStore.setState({
    ...INITIAL_STATE,
    updateReady: useAppShellStore.getState().updateReady,
  })
}

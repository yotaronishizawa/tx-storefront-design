import { useEffect, useRef, useState } from "react"

import { useNavigate } from "react-router"

import { ROUTES } from "~/config/routes"
import { useOpenDialog } from "~/domains/app-shell"
import { usePendingLayoutInitialLocations } from "~/domains/operations"
import { useLayoutRequestActions, useShelfLayoutActions } from "~/domains/shelf"
import { useStoreDataSettled } from "~/domains/store-selection"
import type { ShelfLocation } from "~/model/shelf"

import { LAYOUT_BLOCK_DIALOG } from "../../_hooks/use-layout-entry-block"

type EditEntryState =
  | "checking"
  | "pending-locked"
  | "pending-cancellable"
  | "ready"

export function useEditEntry(hasPendingSubmission = false) {
  const openDialog = useOpenDialog()
  const navigate = useNavigate()
  const { cancelPendingLayoutChange, checkLayoutEntry } =
    useLayoutRequestActions()
  const { startEditing } = useShelfLayoutActions()
  const [state, setState] = useState<EditEntryState>("checking")
  const pendingLayout = usePendingLayoutInitialLocations()
  const storeSettled = useStoreDataSettled()
  const started = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  function goHome() {
    void navigate(ROUTES.home().pathname, { replace: true })
  }

  async function openEditor(startFrom?: ShelfLocation[]) {
    await startEditing(startFrom)
    setState("ready")
  }

  // Waits for the store data: a late snapshot would replace the edits.
  useEffect(() => {
    if (!storeSettled || started.current) {
      return
    }
    started.current = true
    // A submission with an unknown outcome must be read back, never cancelled
    // or replaced by opening a fresh edit session.
    if (hasPendingSubmission) {
      setState("ready")
      return
    }
    void (async () => {
      const check = await checkLayoutEntry()
      if (!mounted.current) {
        return
      }
      if (check.kind === "blocked") {
        openDialog(LAYOUT_BLOCK_DIALOG[check.block])
        goHome()
        return
      }
      if (check.kind === "pending") {
        setState(
          check.pending === "locked" ? "pending-locked" : "pending-cancellable"
        )
        return
      }
      await openEditor()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSettled, hasPendingSubmission])

  /** With `resend`, the edits start from the layout the cancelled change was made on, as the store app's "modify and send again". */
  async function cancelPendingAndEdit(resend: boolean) {
    // Read before cancelling: the request is gone after.
    const startFrom = resend ? pendingLayout : undefined
    setState("checking")
    if (await cancelPendingLayoutChange()) {
      await openEditor(startFrom)
    } else {
      goHome()
    }
  }

  return {
    state,
    canResendPending: pendingLayout.length > 0,
    cancelPendingAndEdit,
    goHome,
  }
}

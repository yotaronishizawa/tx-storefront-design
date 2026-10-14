import { useNavigate } from "react-router"

import { ROUTES } from "~/config/routes"
import { useOpenDialog } from "~/domains/app-shell"
import { useShelfSelection } from "~/domains/shelf"

import { useLayoutEntryBlockDialog } from "./use-layout-entry-block"

export function useOpenEditLayout(): () => void {
  const blockDialog = useLayoutEntryBlockDialog()
  const { selectCell } = useShelfSelection()
  const openDialog = useOpenDialog()
  const navigate = useNavigate()

  return () => {
    if (blockDialog) {
      openDialog(blockDialog)
      return
    }

    selectCell(null)
    void navigate(ROUTES.edit().pathname)
  }
}

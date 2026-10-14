import { useState, type FormEvent } from "react"

import { Navigate, useLocation } from "react-router"

import type { Credentials } from "~/api/opm/schemas"
import { AppBootSplash } from "~/components/layout/app-boot-splash"
import { ROUTES } from "~/config/routes"
import { useOpenDialog } from "~/domains/app-shell"
import { useRestockRequest } from "~/domains/operations"
import {
  useScannerConnected,
  useScannerConnectionSource,
} from "~/domains/restocking"
import {
  useIsBootstrapping,
  useSession,
  useSessionActions,
} from "~/domains/session"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { isActiveRequest } from "~/model/request-state"
import { openManualDocument } from "~/utils/manual-document"
import { LoginView } from "~/views/store/login"

import { AppDialogs } from "../_components/app-dialogs"

export default function LoginPage() {
  const isBootstrapping = useIsBootstrapping()
  const session = useSession()
  const { handleLogin } = useSessionActions()
  const [login, setLogin] = useState<Credentials>({ agentId: "", password: "" })
  const [loginState, setLoginState] = useState<"idle" | "loading">("idle")

  const restockRequest = useRestockRequest()
  const scannerConnected = useScannerConnected()
  const scannerConnectionSource = useScannerConnectionSource()
  const isOnline = useOnlineStatus()
  const openDialog = useOpenDialog()
  const location = useLocation()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginState("loading")
    await handleLogin(login)
    setLoginState("idle")
  }

  function patchLogin(patch: Partial<Credentials>) {
    setLogin((current) => ({ ...current, ...patch }))
  }

  if (isBootstrapping) {
    return <AppBootSplash />
  }

  if (session) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate replace to={from ?? ROUTES.home().pathname} />
  }

  return (
    <LoginView
      isOnline={isOnline}
      isRestockingInProgress={isActiveRequest(restockRequest)}
      login={login}
      loginState={loginState}
      scannerConnected={scannerConnected}
      scannerConnectionSource={scannerConnectionSource}
      patchLogin={patchLogin}
      onManualDocumentOpen={openManualDocument}
      onOpenScannerRecovery={() => openDialog("scanner-recovery")}
      onSubmit={handleSubmit}
    >
      <AppDialogs />
    </LoginView>
  )
}

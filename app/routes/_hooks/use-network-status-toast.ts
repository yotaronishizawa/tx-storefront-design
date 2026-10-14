import { useEffect } from "react"

import { useTranslation } from "react-i18next"

import { Toast } from "~/core"

export function useNetworkStatusToast(isOnline: boolean) {
  const { t } = useTranslation("app")

  useEffect(() => {
    if (isOnline) {
      Toast.notify.dismiss("network-status")
      return
    }

    Toast.notify.warning(t("offlineModeNotice"), {
      duration: Infinity,
      key: "network-status",
    })

    return () => {
      Toast.notify.dismiss("network-status")
    }
  }, [isOnline, t])
}

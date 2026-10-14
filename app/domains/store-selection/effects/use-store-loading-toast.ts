import { useEffect } from "react"

import { useTranslation } from "react-i18next"

import { Toast } from "~/core"

import { useStoreSelectionStore } from "../store-selection-store"

const LOADING_TOAST_KEY = "store-loading"

/** One app-wide spinner for the store-data load, keyed so it survives navigation. */
export function useStoreLoadingToast() {
  const { t } = useTranslation("app")
  const loadState = useStoreSelectionStore((state) => state.loadState)

  useEffect(() => {
    if (loadState === "loading") {
      Toast.notify.loading(t("loadingStoreData"), { key: LOADING_TOAST_KEY })
      return () => {
        Toast.notify.dismiss(LOADING_TOAST_KEY)
      }
    }

    Toast.notify.dismiss(LOADING_TOAST_KEY)
  }, [loadState, t])
}

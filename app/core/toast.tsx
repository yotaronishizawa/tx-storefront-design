import type { ReactNode } from "react"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { CircleAlert, CircleCheck, Info, Loader2, X } from "lucide-react"

type ToastType = "error" | "info" | "loading" | "success" | "warning"

type ToastOptions = {
  description?: ReactNode
  /** Milliseconds; `Infinity` keeps the toast until dismissed. */
  duration?: number
  /** Names the toast so a later call replaces it instead of stacking. */
  key?: string
}

const toastManager = ToastPrimitive.createToastManager()

// Base UI mints its own ids, so keyed toasts map the caller's key to the live id.
const idsByKey = new Map<string, string>()

// Base UI reads a timeout of 0 as "never auto-dismiss".
function toTimeout(duration: number | undefined) {
  return duration === Number.POSITIVE_INFINITY ? 0 : duration
}

function show(
  type: ToastType,
  message: string,
  { description, duration, key }: ToastOptions = {}
) {
  const timeout = toTimeout(duration)

  const existingId = key ? idsByKey.get(key) : undefined
  if (existingId) {
    toastManager.update(existingId, {
      description,
      timeout,
      title: message,
      type,
    })
    return existingId
  }

  const id = toastManager.add({
    description,
    timeout,
    title: message,
    type,
    // Removal fires after the exit animation, when the key may already name a newer toast.
    onRemove: key
      ? () => {
          if (idsByKey.get(key) === id) {
            idsByKey.delete(key)
          }
        }
      : undefined,
  })

  if (key) {
    idsByKey.set(key, id)
  }

  return id
}

export const notify = {
  dismiss(key: string) {
    const id = idsByKey.get(key)
    if (!id) {
      return
    }
    idsByKey.delete(key)
    toastManager.close(id)
  },
  error: (message: string, options?: ToastOptions) =>
    show("error", message, options),
  info: (message: string, options?: ToastOptions) =>
    show("info", message, options),
  loading: (message: string, options?: ToastOptions) =>
    show("loading", message, {
      duration: Number.POSITIVE_INFINITY,
      ...options,
    }),
  success: (message: string, options?: ToastOptions) =>
    show("success", message, options),
  warning: (message: string, options?: ToastOptions) =>
    show("warning", message, options),
}

const TOAST_ICONS: Record<string, ReactNode> = {
  error: <CircleAlert className="size-5 text-error" />,
  info: <Info className="size-5 text-info" />,
  loading: <Loader2 className="size-5 animate-spin text-inverse" />,
  success: <CircleCheck className="size-5 text-success" />,
  warning: <CircleAlert className="size-5 text-warning" />,
}

function ToastList({ closeLabel }: Viewport.Props) {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      className="absolute top-0 right-0 left-auto z-90 mr-0 w-88 max-w-[calc(100vw-2rem)] rounded-lg bg-inverse p-4 text-inverse shadow-dialog transition-all duration-200 select-none after:absolute after:top-full after:left-0 after:h-5 after:w-full data-ending-style:opacity-0 data-expanded:transform-[translateY(var(--toast-offset-y))] data-starting-style:opacity-0 [&:not([data-expanded])]:transform-[translateY(calc(var(--toast-offset-y)+var(--toast-index)*0.6rem))_scale(calc(1-var(--toast-index)*0.05))]"
      toast={toast}
    >
      <div className="flex items-start gap-3">
        <span className="mt-px shrink-0">{TOAST_ICONS[toast.type ?? ""]}</span>
        <div className="min-w-0 flex-1">
          <ToastPrimitive.Title className="text-sm font-bold" />
          {/* A `div`, not the default `p`, because a description can hold block content. */}
          <ToastPrimitive.Description className="text-xs" render={<div />} />
        </div>
        <ToastPrimitive.Close
          aria-label={closeLabel}
          className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="size-4" />
        </ToastPrimitive.Close>
      </div>
    </ToastPrimitive.Root>
  ))
}

/** Mounted once, from `app/root.tsx`, which supplies the translated close label. */
export function Viewport({ closeLabel }: Viewport.Props) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed top-4 right-4 z-90 flex w-88 max-w-[calc(100vw-2rem)]">
          <ToastList closeLabel={closeLabel} />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

export declare namespace Viewport {
  type Props = { closeLabel: string }
}

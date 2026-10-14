import { useState } from "react"

import { Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Field } from "~/core"

export function PasswordField({
  value,
  onChange,
}: {
  value: string
  onChange: (password: string) => void
}) {
  const { t } = useTranslation(["app", "common"])
  const [showPassword, setShowPassword] = useState(false)

  const entity = t("common:entity.password", { count: 1 })
  const toggleLabel = showPassword
    ? t("common:actions.hideWithEntity", { entity })
    : t("common:actions.showWithEntity", { entity })

  return (
    <Field.Root>
      <Field.Label className="mt-4" htmlFor="password">
        {t("password")}
      </Field.Label>
      <div className="mt-1 flex h-8 items-center rounded-md border border-strong bg-default focus-within:ring-2 focus-within:ring-primary">
        <Field.Control
          id="password"
          autoComplete="current-password"
          className="min-w-0 flex-1 rounded-md border-0 bg-transparent px-4 text-xs font-bold text-primary outline-none"
          placeholder={t("password")}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
        <Button
          variant="unstyled"
          size="unstyled"
          aria-label={toggleLabel}
          className="grid h-8 w-10 shrink-0 place-items-center rounded-md text-primary transition active:bg-muted [&_svg]:size-4"
          type="button"
          onClick={() => setShowPassword((current) => !current)}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </Field.Root>
  )
}

import { useTranslation } from "react-i18next"

import { Checkbox } from "~/core"

/** "I have read the rules above"; unlocks the dialog's confirm button. */
export function RulesConfirmCheckbox({
  checked,
  disabled,
  onCheckedChange,
}: {
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const { t } = useTranslation("app")

  return (
    <label className="flex shrink-0 items-center gap-3 text-lg font-bold text-primary">
      <Checkbox.Root
        checked={checked}
        className="size-6"
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
      {t("restockingRuleConfirm")}
    </label>
  )
}

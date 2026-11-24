import { useTranslation } from "react-i18next"

import { Button, Notice } from "~/core"

/**
 * Red lanes still left, in words: the shelf row's red counts say where, this
 * says that they must be fixed, and its button goes to them. Shown only while
 * a red lane is left, so it never competes with "here" otherwise. The same
 * banner sits in the same place while fixing, without the button.
 */
export function LaneErrorBanner({
  count,
  note,
  onFix,
}: {
  count: number
  /** A second line, e.g. why Send waits. */
  note?: string
  /** Left out while a red lane is already being fixed. */
  onFix?: () => void
}) {
  const { t } = useTranslation("app")
  const left = t("restockErrorsLeft", { count })
  return (
    <Notice
      action={
        onFix && (
          <Button size="lg" type="button" variant="secondary" onClick={onFix}>
            {t("restockErrorsFix")}
          </Button>
        )
      }
      // The 60px button is taller than one line; centre the words on it, and
      // keep that height without it, so the zoom below never moves.
      className="min-h-23 items-center"
      title={note ? left : undefined}
      tone="error"
    >
      {note ?? left}
    </Notice>
  )
}

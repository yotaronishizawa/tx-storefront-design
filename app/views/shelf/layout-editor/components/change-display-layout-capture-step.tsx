import type { ReactNode } from "react"

import { useTranslation } from "react-i18next"

import { MessageDialog } from "~/components/dialog/message-dialog"
import { PanelTitle } from "~/components/layout/panel-title"
import { Button } from "~/core"

import type { LayoutEditor } from "../hooks/use-layout-editor"
import { DraftPromptDialog } from "./draft-prompt-dialog"
import { ShelfQuestionIllustration } from "./shelf-question-illustration"

const QUESTION_TEXT = {
  faces: {
    question: "layoutFaceQuestion",
    example: "layoutFaceQuestionExample",
  },
  height: {
    question: "layoutHeightQuestion",
    example: "layoutHeightQuestionExample",
  },
} as const

export function LayoutCaptureQuestionStep({
  editor,
  step,
  titleLeading,
}: {
  editor: LayoutEditor
  step: "faces" | "height"
  titleLeading?: ReactNode
}) {
  const { t } = useTranslation(["app", "common"])

  const text = QUESTION_TEXT[step]
  const answer =
    step === "faces" ? editor.answerFacesQuestion : editor.answerHeightQuestion

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-5 flex min-w-0 items-start gap-4">
        {titleLeading}
        <div className="min-w-0">
          <PanelTitle title={t("displayLayoutChange")} />
          <p className="mt-1 text-sm font-bold text-secondary">
            {t("layoutCaptureQuestionIntro")}
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 place-items-center rounded-lg border bg-default p-8">
        <section className="grid w-full max-w-4xl gap-8">
          <div className="grid gap-6 md:grid-cols-[1fr_1.05fr] md:items-center">
            <ShelfQuestionIllustration variant={step} />
            <div className="min-w-0">
              <p className="text-lg/relaxed font-bold whitespace-pre-line">
                {t(text.question)}
              </p>
              <p className="mt-5 text-sm/relaxed font-bold whitespace-pre-line text-secondary">
                {t(text.example)}
              </p>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-90 grid-cols-2 gap-4">
            <Button
              variant="primary"
              size="md"
              type="button"
              onClick={() => answer(true)}
            >
              {t("common:boolean.yes")}
            </Button>
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => answer(false)}
            >
              {t("common:boolean.no")}
            </Button>
            {step === "height" && (
              <Button
                className="col-span-2"
                variant="secondary"
                size="md"
                type="button"
                onClick={editor.backToFacesQuestion}
              >
                {t("common:actions.back")}
              </Button>
            )}
          </div>
        </section>
      </div>

      <DraftPromptDialog
        open={editor.draftPromptOpen}
        onApply={editor.applyDraft}
        onSkip={editor.skipDraft}
      />
      <MessageDialog
        message={editor.message}
        okLabel={t("common:actions.ok")}
        open={Boolean(editor.message)}
        onClose={editor.clearMessage}
      />
    </section>
  )
}

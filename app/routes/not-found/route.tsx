import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { ROUTES } from "~/config/routes"

export default function NotFoundPage() {
  const { t } = useTranslation(["app", "common"])

  return (
    <main className="flex h-svh flex-col items-center justify-center gap-6 bg-default p-8 text-center text-primary">
      <h1 className="text-xl font-bold">404</h1>
      <Link
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-xs font-bold text-on-primary transition active:bg-primary-pressed"
        to={ROUTES.home().pathname}
      >
        {t("common:nav.home")}
      </Link>
    </main>
  )
}

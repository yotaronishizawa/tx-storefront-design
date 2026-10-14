/** Shown while the stored session is restored; same background as the app, so there is no flash. */
export function AppBootSplash() {
  return (
    <main
      aria-busy="true"
      className="flex h-svh flex-col items-center justify-center bg-default"
    />
  )
}

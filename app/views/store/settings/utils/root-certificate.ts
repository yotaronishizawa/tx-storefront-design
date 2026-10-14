const ROOT_CERTIFICATE_PATH = "/rootCA.cer"
const ROOT_CERTIFICATE_DOWNLOAD_NAME = "rootCA.cer"

/** Downloads through a blob so the file is saved, falling back to a plain link if the fetch fails. */
export async function downloadRootCertificateFile() {
  try {
    const response = await fetch(ROOT_CERTIFICATE_PATH, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`Certificate download failed: ${response.status}`)
    }

    const certificate = new Blob([await response.arrayBuffer()], {
      type: response.headers.get("content-type") ?? "application/pkix-cert",
    })
    const certificateUrl = window.URL.createObjectURL(certificate)

    triggerDownload(certificateUrl, ROOT_CERTIFICATE_DOWNLOAD_NAME)
    window.setTimeout(() => window.URL.revokeObjectURL(certificateUrl), 1000)
  } catch {
    triggerDownload(ROOT_CERTIFICATE_PATH, ROOT_CERTIFICATE_DOWNLOAD_NAME)
  }
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
}

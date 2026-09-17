/**
 * Renders a DOM node to an A4 PDF using html2canvas + jsPDF, fitted to whole pages.
 * Both libraries are lazily imported so they never block first paint.
 */
export async function elementToPdf(element: HTMLElement, filename: string): Promise<void> {
  const pdf = await elementToPdfDoc(element)
  pdf.save(filename)
}

/** Same rendering, returned as a Blob (for the Web Share API). */
export async function elementToPdfBlob(element: HTMLElement): Promise<Blob> {
  const pdf = await elementToPdfDoc(element)
  return pdf.output('blob')
}

async function elementToPdfDoc(element: HTMLElement) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const naturalH = (canvas.height * pageW) / canvas.width
  // Fit the sheet to a whole number of pages (normally one) so no page is left
  // mostly blank: shrink slightly when the content just overflows a page.
  const pages = Math.max(1, Math.round(naturalH / pageH))
  const scale = Math.min(1, (pages * pageH) / naturalH)
  const imgW = pageW * scale
  const imgH = naturalH * scale
  const x = (pageW - imgW) / 2
  const imgData = canvas.toDataURL('image/jpeg', 0.92)

  for (let i = 0; i < pages; i++) {
    if (i > 0) pdf.addPage()
    pdf.addImage(imgData, 'JPEG', x, -i * pageH, imgW, imgH)
  }
  return pdf
}

// /lib/pdf/exportElementToPdf.ts
// Requiere:
//   npm i jspdf html2canvas
// Nota: usa import dinámico para no romper SSR en Next.

export async function exportElementToPdf(opts: {
  element: HTMLElement;
  filename: string;
  title?: string;
}) {
  const { element, filename, title } = opts;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Render a canvas (mejor con scale 2 para buena definición)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");

  // A4 portrait en px aproximado, pero jsPDF trabaja por unidades internas; usamos "mm"
  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Márgenes
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  // Escala para encajar ancho
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = usableWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  // Si entra en una página:
  if (imgHeight <= usableHeight) {
    if (title) {
      pdf.setFontSize(12);
      pdf.text(title, margin, margin - 2);
    }
    pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
    pdf.save(filename);
    return;
  }

  // Si no entra: paginado vertical por “slices”
  // Convertimos alturas a “mm”
  let position = 0;
  const sliceHeightPx = (imgProps.height * usableHeight) / imgHeight;

  let pageIndex = 0;
  while (position < imgProps.height) {
    if (pageIndex > 0) pdf.addPage();

    // Creamos un canvas recortado
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.min(sliceHeightPx * 2, canvas.height - position * 2);

    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) break;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

    ctx.drawImage(
      canvas,
      0,
      position * 2,
      canvas.width,
      sliceCanvas.height,
      0,
      0,
      canvas.width,
      sliceCanvas.height,
    );

    const sliceData = sliceCanvas.toDataURL("image/png");

    if (title && pageIndex === 0) {
      pdf.setFontSize(12);
      pdf.text(title, margin, margin - 2);
    }

    const sliceImgProps = pdf.getImageProperties(sliceData);
    const sliceImgHeight = (sliceImgProps.height * imgWidth) / sliceImgProps.width;

    pdf.addImage(sliceData, "PNG", margin, margin, imgWidth, sliceImgHeight);

    position += sliceHeightPx;
    pageIndex += 1;
  }

  pdf.save(filename);
}
/**
 * Generates a PDF from a specific DOM element.
 *
 * @param elementId - The exact DOM id of the element to capture.
 * @param poNumber  - Used as the downloaded filename.
 */
export async function generatePOPDF(elementId: string, poNumber: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`generatePOPDF: element with id "${elementId}" not found in DOM`);
  }

  // Dynamically import html2canvas-pro and jspdf on the client-side to prevent SSR ReferenceError
  const html2canvas = (await import('html2canvas-pro')).default;
  const { jsPDF } = await import('jspdf');

  // Capture the element as canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      // html2canvas-pro crashes when parsing oklch() color variables in stylesheets.
      // We scrub existing inline <style> tags to prevent parsing crashes.
      clonedDoc.querySelectorAll('style').forEach((s) => {
        if (s.innerHTML.includes('oklch')) {
          s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, '#ffffff');
        }
      });
      // And inject a safe fallback for the variables
      const style = clonedDoc.createElement('style');
      style.innerHTML = `
        :root {
          --background: #ffffff !important;
          --foreground: #000000 !important;
          --card: #ffffff !important;
          --card-foreground: #000000 !important;
          --popover: #ffffff !important;
          --popover-foreground: #000000 !important;
          --primary: #000000 !important;
          --primary-foreground: #ffffff !important;
          --secondary: #f1f5f9 !important;
          --secondary-foreground: #000000 !important;
          --muted: #f1f5f9 !important;
          --muted-foreground: #64748b !important;
          --accent: #f1f5f9 !important;
          --accent-foreground: #000000 !important;
          --destructive: #ef4444 !important;
          --border: #e2e8f0 !important;
          --input: #e2e8f0 !important;
          --ring: #94a3b8 !important;
        }
      `;
      clonedDoc.head.appendChild(style);
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 1.0);

  // Create jsPDF instance with A4 landscape orientation
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // A4 dimensions in mm: 297 x 210
  const pdfWidth = 297;
  const pdfHeight = 210;

  // Render canvas image to fill the A4 landscape page
  // The printable template is styled with width '297mm' and minHeight '210mm', so it fits perfectly.
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`PO_${poNumber}.pdf`);
}

export function printElement(elementId: string, title = 'Document') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  if (!iframeWindow) return;

  // Copy all style/link tags from parent document to ensure styles apply
  const headElements = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  iframeWindow.document.open();
  iframeWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: landscape; margin: 0; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style>
        ${headElements}
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  iframeWindow.document.close();

  iframeWindow.focus();
  // Wait a small bit for styles to parse inside iframe before printing
  setTimeout(() => {
    iframeWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}

'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useAdminSession } from '@/lib/use-admin-session';

export function WatermarkToolClient() {
  const router = useRouter();
  const { ready, isAuthenticated } = useAdminSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [outputName, setOutputName] = useState('');
  const [watermarkText, setWatermarkText] = useState('utpaper.in');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/admin');
    }
  }, [ready, isAuthenticated, router]);

  function onFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setMessage('');
    setErrorMessage('');

    if (!file) {
      setSelectedFileName('');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(null);
      setSelectedFileName('');
      setErrorMessage('Please choose a valid PDF file.');
      event.target.value = '';
      return;
    }

    setSelectedFileName(file.name);
    if (!outputName.trim()) {
      setOutputName(baseName(file.name));
    }
  }

  async function processPdf() {
    setMessage('');
    setErrorMessage('');

    if (!selectedFile) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }

    const trimmedWatermark = watermarkText.trim();
    if (!trimmedWatermark) {
      setErrorMessage('Please enter watermark text.');
      return;
    }

    const cleanedOutputName = cleanFileName(outputName.trim() || baseName(selectedFile.name));
    if (!cleanedOutputName) {
      setErrorMessage('Please enter a valid output file name.');
      return;
    }

    setIsProcessing(true);

    try {
      const pdfBytes = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const page of pdfDoc.getPages()) {
        const { width, height } = page.getSize();
        const fontSize = Math.max(30, Math.min(width, height) * 0.085);
        const textWidth = font.widthOfTextAtSize(trimmedWatermark, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        page.drawText(trimmedWatermark, {
          x: (width - textWidth) / 2,
          y: (height - textHeight) / 2,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          opacity: 0.3,
          rotate: degrees(45)
        });
      }

      const outputBytes = await pdfDoc.save();
      const outputBlob = new Blob([Uint8Array.from(outputBytes)], { type: 'application/pdf' });
      const downloadName = `${cleanedOutputName}_utpaper.pdf`;
      downloadBlob(outputBlob, downloadName);
      setMessage(`Watermarked PDF downloaded as ${downloadName}.`);
    } catch {
      setErrorMessage('Failed to process this PDF. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (!ready || !isAuthenticated) {
    return (
      <section className="card admin-card">
        <p className="muted-copy">Checking admin access...</p>
      </section>
    );
  }

  return (
    <>
      <section className="card admin-hero">
        <p className="eyebrow">Browser tool</p>
        <h1 className="section-title">Add Watermark in PYQ</h1>
        <p className="hero__lede">
          Upload a PDF, add the watermark, and download the new file directly from the website. Your file is processed
          in the browser and never uploaded to the server.
        </p>
      </section>

      <section className="card admin-card">
        <div className="admin-form-grid">
          <label className="filter-field">
            <span>Select PDF file</span>
            <input type="file" accept="application/pdf,.pdf" onChange={onFileSelected} />
          </label>

          <label className="filter-field">
            <span>Output file name</span>
            <input
              type="text"
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              placeholder="Example: btechsem"
              maxLength={80}
            />
          </label>

          <label className="filter-field">
            <span>Watermark text</span>
            <input
              type="text"
              value={watermarkText}
              onChange={(event) => setWatermarkText(event.target.value)}
              maxLength={80}
            />
          </label>
        </div>

        {selectedFileName ? (
          <div className="notice-card">
            <strong>Selected file:</strong> <span className="muted-copy">{selectedFileName}</span>
          </div>
        ) : null}

        {message ? <p className="status-message status-success">{message}</p> : null}
        {errorMessage ? <p className="status-message status-error">{errorMessage}</p> : null}

        <div className="button-row">
          <button className="button button--primary" type="button" onClick={processPdf} disabled={isProcessing}>
            {isProcessing ? 'Processing PDF...' : 'Add Watermark And Download'}
          </button>
        </div>
      </section>
    </>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function baseName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, '');
}

function cleanFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
}

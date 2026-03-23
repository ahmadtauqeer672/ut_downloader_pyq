import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Component({
  selector: 'app-watermark-tool',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="hero-card">
      <div>
        <p class="eyebrow">Browser Tool</p>
        <h2>Add Watermark in PYQ</h2>
        <p class="sub">
          Upload a PDF, add the watermark, and download the new file directly from the website. Your file is processed in
          the browser and is not uploaded to the server.
        </p>
      </div>
    </section>

    <section class="tool-card">
      <div class="tool-grid">
        <label class="field">
          <span>Select PDF File</span>
          <input type="file" accept="application/pdf,.pdf" (change)="onFileSelected($event)" />
        </label>

        <label class="field">
          <span>Output File Name</span>
          <input
            type="text"
            [(ngModel)]="outputName"
            placeholder="Example: btechsem"
            maxlength="80"
          />
        </label>

        <label class="field">
          <span>Watermark Text</span>
          <input type="text" [(ngModel)]="watermarkText" maxlength="80" />
        </label>
      </div>

      <div class="file-summary" *ngIf="selectedFileName">
        <strong>Selected file:</strong> {{ selectedFileName }}
      </div>

      <p *ngIf="message" class="message success">{{ message }}</p>
      <p *ngIf="errorMessage" class="message error">{{ errorMessage }}</p>

      <div class="actions">
        <button type="button" class="primary-btn" (click)="processPdf()" [disabled]="isProcessing">
          {{ isProcessing ? 'Processing PDF...' : 'Add Watermark And Download' }}
        </button>
      </div>
    </section>

    <section class="info-grid">
      <article class="info-card">
        <h3>How It Works</h3>
        <ul>
          <li>Select a PDF from your device.</li>
          <li>Choose the output name you want.</li>
          <li>Click the process button.</li>
          <li>The watermarked PDF downloads automatically.</li>
        </ul>
      </article>

      <article class="info-card">
        <h3>Watermark Style</h3>
        <ul>
          <li>Diagonal center watermark</li>
          <li>Default text: <code>utpaper.com</code></li>
          <li>Transparent black text</li>
          <li>Works fully in the browser</li>
        </ul>
      </article>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .hero-card,
      .tool-card,
      .info-card {
        background: #ffffff;
        border: 1px solid #dbe4ef;
        border-radius: 18px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      }
      .hero-card {
        padding: 1.35rem 1.4rem;
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.12), transparent 36%),
          linear-gradient(135deg, #ffffff, #f6fbff);
      }
      .eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.78rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #0f766e;
        font-weight: 800;
      }
      h2,
      h3 {
        margin: 0;
        color: #16324f;
      }
      .sub {
        margin: 0.55rem 0 0;
        max-width: 760px;
        color: #4d5d70;
        line-height: 1.55;
      }
      .tool-card {
        margin-top: 1rem;
        padding: 1.2rem;
      }
      .tool-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }
      .field {
        display: grid;
        gap: 0.45rem;
      }
      .field span {
        color: #16324f;
        font-weight: 700;
      }
      .field input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #d0dbe8;
        border-radius: 12px;
        padding: 0.78rem 0.85rem;
        font: inherit;
        color: #15314f;
        background: #fbfdff;
      }
      .file-summary {
        margin-top: 1rem;
        padding: 0.8rem 0.9rem;
        border-radius: 12px;
        background: #f6fbff;
        color: #2d445d;
      }
      .actions {
        margin-top: 1rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
      }
      .primary-btn {
        border: 0;
        border-radius: 12px;
        padding: 0.85rem 1.1rem;
        background: #0f766e;
        color: #ffffff;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .primary-btn[disabled] {
        opacity: 0.65;
        cursor: not-allowed;
      }
      .message {
        margin: 1rem 0 0;
        padding: 0.8rem 0.9rem;
        border-radius: 12px;
        font-weight: 600;
      }
      .message.success {
        background: #ecfdf5;
        color: #166534;
        border: 1px solid #bbf7d0;
      }
      .message.error {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }
      .info-card {
        padding: 1.15rem 1.2rem;
      }
      .info-card ul {
        margin: 0.8rem 0 0;
        padding-left: 1.2rem;
      }
      .info-card li {
        color: #4d5d70;
        line-height: 1.65;
      }
      code {
        font-family: 'Consolas', 'Courier New', monospace;
      }
      @media (max-width: 900px) {
        .tool-grid,
        .info-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class WatermarkToolComponent {
  selectedFile: File | null = null;
  selectedFileName = '';
  outputName = '';
  watermarkText = 'utpaper.com';
  isProcessing = false;
  message = '';
  errorMessage = '';

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.selectedFile = file;
    this.message = '';
    this.errorMessage = '';

    if (!file) {
      this.selectedFileName = '';
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.errorMessage = 'Please choose a valid PDF file.';
      input.value = '';
      return;
    }

    this.selectedFileName = file.name;
    if (!this.outputName.trim()) {
      this.outputName = this.baseName(file.name);
    }
  }

  async processPdf(): Promise<void> {
    this.message = '';
    this.errorMessage = '';

    if (!this.selectedFile) {
      this.errorMessage = 'Please select a PDF file first.';
      return;
    }

    const watermarkText = this.watermarkText.trim();
    if (!watermarkText) {
      this.errorMessage = 'Please enter watermark text.';
      return;
    }

    const cleanedOutputName = this.cleanFileName(this.outputName.trim() || this.baseName(this.selectedFile.name));
    if (!cleanedOutputName) {
      this.errorMessage = 'Please enter a valid output file name.';
      return;
    }

    this.isProcessing = true;

    try {
      const pdfBytes = await this.selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const page of pdfDoc.getPages()) {
        const { width, height } = page.getSize();
        const fontSize = Math.max(30, Math.min(width, height) * 0.085);
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        page.drawText(watermarkText, {
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
      const outputBlob = new Blob([outputBytes], { type: 'application/pdf' });
      const downloadName = `${cleanedOutputName}_utpaper.pdf`;
      this.downloadBlob(outputBlob, downloadName);
      this.message = `Watermarked PDF downloaded as ${downloadName}.`;
    } catch (_error) {
      this.errorMessage = 'Failed to process this PDF. Please try another file.';
    } finally {
      this.isProcessing = false;
    }
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private baseName(fileName: string): string {
    return fileName.replace(/\.pdf$/i, '');
  }

  private cleanFileName(value: string): string {
    return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
  }
}

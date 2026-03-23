import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

const WATERMARK_TOOL_SCRIPT = `from tkinter import *
from tkinter import filedialog, messagebox
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from io import BytesIO
import os

WATERMARK_TEXT = "utpaper.com"

def create_watermark(width, height):
    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=(width, height))
    c.setFont("Helvetica-Bold", 40)
    c.setFillAlpha(0.3)
    c.setFillColorRGB(0, 0, 0)

    c.saveState()
    c.translate(width / 2, height / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, WATERMARK_TEXT)
    c.restoreState()

    c.save()
    packet.seek(0)
    return PdfReader(packet)

def add_watermark(input_pdf, output_name):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()

    for page in reader.pages:
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)

        watermark = create_watermark(width, height)
        page.merge_page(watermark.pages[0])
        writer.add_page(page)

    folder = os.path.dirname(input_pdf)
    output_pdf = os.path.join(folder, f"{output_name}_utpaper.pdf")

    with open(output_pdf, "wb") as f:
        writer.write(f)

    return output_pdf

def select_file():
    file_path = filedialog.askopenfilename(filetypes=[("PDF Files", "*.pdf")])
    entry_input.delete(0, END)
    entry_input.insert(0, file_path)

def process_pdf():
    input_pdf = entry_input.get()
    output_name = entry_name.get()

    if not input_pdf or not output_name:
        messagebox.showerror("Error", "All fields are required.")
        return

    try:
        output_file = add_watermark(input_pdf, output_name)
        messagebox.showinfo("Success", f"PDF saved:\\n{output_file}")
    except Exception as e:
        messagebox.showerror("Error", str(e))

root = Tk()
root.title("UTPaper PDF Watermark Tool")
root.geometry("500x250")

Label(root, text="Select PDF File").pack(pady=5)
entry_input = Entry(root, width=50)
entry_input.pack()
Button(root, text="Browse", command=select_file).pack(pady=5)

Label(root, text="Enter File Name (Example: btechsem)").pack(pady=5)
entry_name = Entry(root, width=50)
entry_name.pack()

Button(
    root,
    text="Add Watermark",
    command=process_pdf,
    bg="green",
    fg="white"
).pack(pady=20)

root.mainloop()
`;

@Component({
  selector: 'app-watermark-tool',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero-card">
      <div>
        <p class="eyebrow">Utility Download</p>
        <h2>Add Watermark in PYQ</h2>
        <p class="sub">
          Download a ready-to-run Python desktop tool that adds the <strong>utpaper.com</strong> watermark to PDF files.
        </p>
      </div>
      <button type="button" class="download-btn" (click)="downloadScript()">Download Python Tool</button>
    </section>

    <section class="guide-grid">
      <article class="card">
        <h3>How To Use</h3>
        <ol>
          <li>Install Python on your laptop or PC.</li>
          <li>Install the required packages with <code>pip install pypdf reportlab</code>.</li>
          <li>Download the script from this page.</li>
          <li>Run it with <code>python utpaper_watermark_tool.py</code>.</li>
          <li>Select a PDF and choose the output file name.</li>
        </ol>
      </article>

      <article class="card">
        <h3>What It Does</h3>
        <ul>
          <li>Adds a diagonal watermark text: <code>utpaper.com</code></li>
          <li>Keeps the original PDF pages and saves a new file</li>
          <li>Creates an output name like <code>yourname_utpaper.pdf</code></li>
          <li>Uses a simple Tkinter interface for file selection</li>
        </ul>
      </article>
    </section>

    <section class="card code-card">
      <div class="code-head">
        <div>
          <h3>Python Script</h3>
          <p>Copy or download this file and run it locally.</p>
        </div>
        <button type="button" class="secondary-btn" (click)="copyScript()">{{ copyLabel }}</button>
      </div>

      <pre><code>{{ script }}</code></pre>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .hero-card,
      .card {
        background: #ffffff;
        border: 1px solid #dbe4ef;
        border-radius: 18px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      }
      .hero-card {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        padding: 1.3rem 1.4rem;
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
      .download-btn,
      .secondary-btn {
        border: 0;
        border-radius: 12px;
        padding: 0.8rem 1rem;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .download-btn {
        background: #0f766e;
        color: #ffffff;
        min-width: 200px;
      }
      .secondary-btn {
        background: #edf6ff;
        color: #16324f;
      }
      .guide-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }
      .card {
        padding: 1.15rem 1.2rem;
      }
      .card p,
      .card li {
        color: #4d5d70;
        line-height: 1.6;
      }
      ol,
      ul {
        margin: 0.8rem 0 0;
        padding-left: 1.2rem;
      }
      .code-card {
        margin-top: 1rem;
      }
      .code-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
      }
      .code-head p {
        margin: 0.3rem 0 0;
      }
      pre {
        margin: 0;
        padding: 1rem;
        overflow: auto;
        border-radius: 14px;
        background: #071523;
        color: #dcefff;
        font-size: 0.93rem;
        line-height: 1.55;
      }
      code {
        font-family: 'Consolas', 'Courier New', monospace;
      }
      @media (max-width: 860px) {
        .hero-card,
        .code-head {
          flex-direction: column;
          align-items: flex-start;
        }
        .guide-grid {
          grid-template-columns: 1fr;
        }
        .download-btn {
          width: 100%;
        }
      }
    `
  ]
})
export class WatermarkToolComponent {
  readonly script = WATERMARK_TOOL_SCRIPT;
  copyLabel = 'Copy Script';

  copyScript(): void {
    navigator.clipboard.writeText(this.script).then(() => {
      this.copyLabel = 'Copied';
      setTimeout(() => (this.copyLabel = 'Copy Script'), 1600);
    });
  }

  downloadScript(): void {
    const blob = new Blob([this.script], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'utpaper_watermark_tool.py';
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

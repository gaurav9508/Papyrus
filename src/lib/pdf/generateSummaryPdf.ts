import PDFDocument from "pdfkit";

export async function generateSummaryPdf(params: {
  title: string;
  summaryText: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(params.title, { align: "left" });
    doc.moveDown(1);

    doc.fontSize(11).font("Helvetica");
    const lines = params.summaryText.split("\n");
    for (const line of lines) {
      if (line.startsWith("## ")) {
        doc
          .moveDown(0.5)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(line.replace("## ", ""));
        doc.fontSize(11).font("Helvetica");
      } else if (line.startsWith("- ")) {
        doc.text(`•  ${line.replace("- ", "")}`, { indent: 15 });
      } else {
        doc.text(line);
      }
    }

    doc.end();
  });
}

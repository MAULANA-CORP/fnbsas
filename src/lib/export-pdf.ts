import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { tanggalWIB } from "@/lib/utils";

export function exportRowsToPdf(params: {
  judul: string;
  modul: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  const doc = new jsPDF({ orientation: params.columns.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(params.judul, 14, 16);
  doc.setFontSize(9);
  doc.text(`Gampangin FNB · ${tanggalWIB()}`, 14, 22);
  autoTable(doc, {
    startY: 26,
    head: [params.columns],
    body: params.rows.map((r) => r.map(String)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 175] },
  });
  const filename = `gampangin-fnb-${params.modul}-${tanggalWIB().replace(/-/g, "")}.pdf`;
  doc.save(filename);
  return filename;
}

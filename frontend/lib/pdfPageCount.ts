/**
 * Very lightweight, dependency-free page count estimate: scans the raw PDF
 * bytes for "/Type /Page" object markers. Works for the large majority of
 * real-world PDFs (uncompressed xref tables) and is purely cosmetic - if it
 * can't find a count we just don't show one. The backend's PyMuPDF-based
 * count is authoritative; this is only for the pre-upload file chip.
 */
export async function estimatePdfPageCount(file: File): Promise<number | null> {
  try {
    const buf = await file.slice(0, 5_000_000).arrayBuffer();
    const text = new TextDecoder("latin1").decode(buf);
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) return matches.length;
    return null;
  } catch {
    return null;
  }
}

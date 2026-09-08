export function isLowStock(item: { quantity: number; minStock: number }) {
  return item.quantity <= item.minStock;
}

/** Unduh data sebagai file di browser (tanpa lib tambahan). */
export function downloadBlob(data: BlobPart, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Ambil nama file dari header Content-Disposition, fallback ke default. */
export function filenameFromDisposition(
  header: string | null,
  fallback: string
): string {
  const m = header?.match(/filename="?([^"]+)"?/);
  return m?.[1] ?? fallback;
}

export function binCellStyle(bin: {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  color?: string | null;
}): React.CSSProperties {
  return {
    gridRowStart: bin.row + 1,
    gridColumnStart: bin.col + 1,
    gridRowEnd: `span ${bin.rowSpan}`,
    gridColumnEnd: `span ${bin.colSpan}`,
    ...(bin.color ? { borderColor: bin.color } : {}),
  };
}

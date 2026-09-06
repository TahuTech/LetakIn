export function isLowStock(item: { quantity: number; minStock: number }) {
  return item.quantity <= item.minStock;
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

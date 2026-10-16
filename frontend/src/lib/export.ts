import * as XLSX from 'xlsx';

export function exportToExcel(rows: Record<string, unknown>[], filename: string): void {
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns based on content
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((r) => String(r[key] ?? '').length),
    );
    return { wch: Math.min(maxLen + 2, 60) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

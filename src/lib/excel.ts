import * as XLSX from 'xlsx';
import { formatLongDate } from '@/lib/utils';

export interface ExcelColumn {
  header: string;
  accessor: string;
  width?: number;
}

export interface DateRange {
  fromDate?: string;
  toDate?: string;
}

export async function downloadExcel<T>(
  data: T[],
  filename: string,
  sheetName: string,
  columns: ExcelColumn[],
  dateRange?: DateRange | null
) {
  if (typeof window === 'undefined') return;
  
  try {
    // Transform data based on column access
    const transformedData = data.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        const value = row[col.accessor as keyof T];
        
        // Format dates if they are date fields
        if (col.accessor.includes('Date') || col.accessor.includes('openDate') || 
            col.accessor.includes('interviewDate') || col.accessor.includes('submission') ||
            col.accessor.includes('offerDate') || col.accessor.includes('joiningDate')) {
          obj[col.header] = value ? formatLongDate(value as string) : '—';
        } else if (col.accessor.includes('CTC') || col.accessor.includes('ctc')) {
          obj[col.header] = value ? `${value} Lacs` : '—';
        } else {
          obj[col.header] = value ?? '—';
        }
      });
      
      return obj;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(transformedData);
    
    // Set column widths
    const colWidths = columns.map(col => ({
      wch: col.width || Math.max(col.header.length, 15)
    }));
    worksheet['!cols'] = colWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Add metadata sheet if date range is provided
    if (dateRange) {
      const infoData = [
        { 'Report Date Range': `${dateRange.fromDate ?? 'All'} to ${dateRange.toDate ?? 'All'}` },
        { 'Generated': new Date().toLocaleString() },
      ];
      const infoSheet = XLSX.utils.json_to_sheet(infoData);
      XLSX.utils.book_append_sheet(workbook, infoSheet, 'Info');
    }
    
    // Write file
    XLSX.writeFile(workbook, filename);
    
  } catch (error) {
    console.error('Excel export error:', error);
    throw error;
  }
}

export function exportToCSV<T>(data: T[], filename: string, columns: ExcelColumn[]) {
  if (typeof window === 'undefined') return;
  
  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.accessor as keyof T];
      const formatted = col.accessor.includes('Date') ? 
        (value ? formatLongDate(value as string) : '—') : 
        (value ?? '—');
      
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(formatted);
      return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
    }).join(',');
  });
  
  const csvContent = `${headers}\n${rows.join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.replace('.xlsx', '.csv'));
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

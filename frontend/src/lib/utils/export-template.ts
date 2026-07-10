import * as XLSX from 'xlsx';

/**
 * Export a blank Excel template for bulk product import
 * with the required columns
 */
export function downloadBulkImportTemplate() {
  const templateData = [
    {
      'اسم المنتج': '',
      'الفئة': '',
      'السعر': '',
      'الوحدة': '',
      'الكمية المتوفرة': '',
      'الوصف': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // اسم المنتج
    { wch: 15 }, // الفئة
    { wch: 12 }, // السعر
    { wch: 12 }, // الوحدة
    { wch: 18 }, // الكمية المتوفرة
    { wch: 30 }, // الوصف
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المنتجات');

  // Download the file
  XLSX.writeFile(workbook, 'قالب_استيراد_المنتجات.xlsx');
}

/**
 * Alternative: Export template as CSV
 */
export function downloadBulkImportTemplateCSV() {
  const headers = ['اسم المنتج', 'الفئة', 'السعر', 'الوحدة', 'الكمية المتوفرة', 'الوصف'];
  const csvContent = headers.join(',') + '\n'; // Empty rows with headers only

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'قالب_استيراد_المنتجات.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

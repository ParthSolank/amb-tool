import * as XLSX from 'xlsx';

export interface ParsedTransaction {
  date: Date;
  balance: number;
}

export const parseDateSmart = (str: string): Date | null => {
  if (!str) return null;
  const s = str.trim().replace(/[\\/]/g, '-');
  
  // DD-MM-YYYY or YYYY-MM-DD
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // DD-MMM-YYYY
  const parts = s.split(/[- .]/);
  if (parts.length >= 3) {
    const monthNames: {[key: string]: number} = {
      jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11
    };
    let day = parseInt(parts[0]);
    let monthStr = parts[1].toLowerCase().substring(0,3);
    let year = parseInt(parts[2]);
    if (year < 100) year += 2000;
    
    if (monthNames[monthStr] !== undefined) {
      return new Date(year, monthNames[monthStr], day);
    }
  }
  return null;
};

export const processImportedRows = (rows: any[][]): ParsedTransaction[] => {
  if (rows.length < 2) return [];

  // Find headers
  let dateIdx = -1, balIdx = -1;
  const headerSearchLimit = Math.min(rows.length, 50);

  for (let i = 0; i < headerSearchLimit; i++) {
    if (!rows[i]) continue;
    const row = rows[i].map(c => String(c || '').toLowerCase());
    const dIdx = row.findIndex(c => c && (c.includes('date') || c.includes('txn') || c.includes('tran')));
    const bIdx = row.findIndex(c => c && (c.includes('bal') || c.includes('close') || c.includes('amount')));

    if (dIdx !== -1 && bIdx !== -1 && dIdx !== bIdx) {
      dateIdx = dIdx;
      balIdx = bIdx;
      break;
    }
  }

  if (dateIdx === -1 || balIdx === -1) return [];

  const results: ParsedTransaction[] = [];
  rows.forEach(row => {
    const dateStr = String(row[dateIdx]);
    const balStr = String(row[balIdx]).replace(/[^0-9.]/g, '');
    const date = parseDateSmart(dateStr);
    const balance = parseFloat(balStr);

    if (date && !isNaN(balance)) {
      results.push({ date, balance });
    }
  });

  return results;
};

export const parseExcel = async (file: File): Promise<ParsedTransaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
        resolve(processImportedRows(rows));
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const parsePDF = async (file: File): Promise<ParsedTransaction[]> => {
  if (typeof window === 'undefined') return [];
  
  // Dynamically import to avoid SSR errors
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  const fullTextRows: string[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    const lines: { [y: number]: { x: number; text: string }[] } = {};
    textContent.items.forEach((item: any) => {
      const y = Math.round(item.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push({ x: item.transform[4], text: item.str });
    });

    const sortedY = Object.keys(lines).sort((a, b) => Number(b) - Number(a));
    sortedY.forEach(y => {
      const lineItems = lines[Number(y)].sort((a, b) => a.x - b.x);
      fullTextRows.push(lineItems.map(it => it.text));
    });
  }

  return processImportedRows(fullTextRows);
};

export const parseCSV = async (file: File): Promise<ParsedTransaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => row.split(','));
      resolve(processImportedRows(rows));
    };
    reader.readAsText(file);
  });
};

'use client';

import React, { useRef } from 'react';
import { X, Upload, Download, FileJson, Package, Sun, Moon } from 'lucide-react';
import { AppState } from '@/lib/types';
import { parseCSV, parseExcel, parsePDF, ParsedTransaction } from '@/lib/parsers';

interface SettingsModalProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export default function SettingsModal({ state, setState, isOpen, onClose, showToast }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    let results: ParsedTransaction[] = [];

    try {
      showToast('⌛ Parsing file...');
      if (ext === 'xlsx' || ext === 'xls') results = await parseExcel(file);
      else if (ext === 'pdf') results = await parsePDF(file);
      else results = await parseCSV(file);

      if (results.length > 0) {
        setState(prev => {
          const newAccounts = [...prev.accounts];
          const acc = { ...newAccounts[prev.activeAccountIndex] };
          acc.months = { ...acc.months };
          const monthKey = `${prev.viewMonth.y}-${String(prev.viewMonth.m + 1).padStart(2, '0')}`;
          acc.months[monthKey] = { ...acc.months[monthKey] };

          results.forEach(res => {
            if (res.date.getFullYear() === prev.viewMonth.y && res.date.getMonth() === prev.viewMonth.m) {
              acc.months[monthKey][res.date.getDate()] = res.balance;
            }
          });

          newAccounts[prev.activeAccountIndex] = acc;
          return { ...prev, accounts: newAccounts };
        });
        showToast(`✅ Imported ${results.length} records`);
      } else {
        showToast('❌ No valid data found');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Import failed');
    }
  };

  const setCurrency = (curr: string) => {
    setState(prev => ({ ...prev, currency: curr }));
  };

  const handleExportPDF = async () => {
    try {
      showToast('⌛ Generating PDF...');
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      const appElement = document.querySelector('.app-container') as HTMLElement;
      if (!appElement) return;

      const canvas = await html2canvas(appElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: state.theme === 'dark' ? '#050508' : '#f4f5f8'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AMB_Report_${state.viewMonth.y}_${state.viewMonth.m + 1}.pdf`);
      showToast('✅ PDF Saved');
    } catch (err) {
      console.error(err);
      showToast('❌ Export failed');
    }
  };

  const handleBackup = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ambpro_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('💾 Backup downloaded');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const json = JSON.parse(re.target?.result as string);
        setState(json);
        showToast('🔄 Restore complete');
      } catch (err) {
        showToast('❌ Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal">
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Settings</span>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <button className="btn btn-ghost" onClick={() => setState(p => ({...p, theme: p.theme === 'dark' ? 'light' : 'dark'}))}>
            {state.theme === 'dark' ? <Sun size={16} style={{marginRight: 8}}/> : <Moon size={16} style={{marginRight: 8}}/>} Theme
          </button>
          <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}><Upload size={16} style={{marginRight: 8}}/> Import File</button>
          <button className="btn btn-ghost" onClick={() => {/* export csv */}}><Download size={16} style={{marginRight: 8}}/> Export CSV</button>
          <button className="btn btn-ghost" onClick={handleBackup}><Package size={16} style={{marginRight: 8}}/> Backup</button>
          <button className="btn btn-ghost" onClick={() => jsonInputRef.current?.click()}><FileJson size={16} style={{marginRight: 8}}/> Restore</button>
          <button className="btn btn-ghost" onClick={handleExportPDF} style={{ gridColumn: 'span 2', background: 'var(--accent)', color: 'white' }}>📄 Export PDF Report</button>
        </div>


        <input type="file" ref={fileInputRef} accept=".csv,.xls,.xlsx,.pdf" style={{ display: 'none' }} onChange={handleImport} />
        <input type="file" ref={jsonInputRef} accept=".json" style={{ display: 'none' }} onChange={handleRestore} />
      </div>
    </div>
  );
}

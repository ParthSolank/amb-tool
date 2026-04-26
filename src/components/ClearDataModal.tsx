'use client';

import React from 'react';
import { X, Calendar, History, Trash2, AlertTriangle } from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: (scope: 'month' | 'year' | 'all') => void;
  monthName: string;
  year: number;
}

export default function ClearDataModal({ isOpen, onClose, onClear, monthName, year }: ClearDataModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ transform: 'translateY(0)', width: '90%', maxWidth: '400px', borderRadius: '28px' }}>
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', borderRadius: '12px' }}>
              <Trash2 size={20} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600' }}>Clear Data</span>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}><X size={20} /></button>
        </div>

        <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
          What data would you like to clear for the active account? This action cannot be undone.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => onClear('month')}
            style={{ justifyContent: 'flex-start', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', gap: '12px' }}
          >
            <Calendar size={20} style={{ color: 'var(--accent)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>Current Month Only</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Clear balances for {monthName} {year}</div>
            </div>
          </button>

          <button 
            className="btn btn-ghost" 
            onClick={() => onClear('year')}
            style={{ justifyContent: 'flex-start', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', gap: '12px' }}
          >
            <History size={20} style={{ color: 'var(--accent)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>Full Year</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Clear all records in {year}</div>
            </div>
          </button>

          <button 
            className="btn btn-ghost" 
            onClick={() => onClear('all')}
            style={{ justifyContent: 'flex-start', padding: '16px', borderRadius: '16px', border: '1px solid var(--red)', gap: '12px', background: 'rgba(239, 68, 68, 0.05)' }}
          >
            <AlertTriangle size={20} style={{ color: 'var(--red)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--red)' }}>Clear All Time</div>
              <div style={{ fontSize: '12px', color: 'var(--red)', opacity: 0.8 }}>Wipe all history for this account</div>
            </div>
          </button>
        </div>

        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

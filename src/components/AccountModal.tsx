'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, target: number) => void;
  onDelete?: () => void;
  initialName?: string;
  initialTarget?: number;
  title: string;
}

export default function AccountModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  initialName = '', 
  initialTarget = 0,
  title
}: AccountModalProps) {
  const [name, setName] = useState(initialName);
  const [target, setTarget] = useState(initialTarget.toString());

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setTarget(initialTarget.toString());
    }
  }, [isOpen, initialName, initialTarget]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim() && !isNaN(parseFloat(target))) {
      onSave(name.trim(), parseFloat(target));
      onClose();
    }
  };

  return (
    <div className="modal-overlay open" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ transform: 'translateY(0)', width: '90%', maxWidth: '380px', borderRadius: '24px' }}>
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '20px', fontWeight: '600' }}>{title}</span>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div className="stat-label" style={{ marginBottom: '8px' }}>Bank Name</div>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g. HDFC Bank"
            autoFocus
            style={{ marginBottom: '16px' }}
          />

          <div className="stat-label" style={{ marginBottom: '8px' }}>Target AMB</div>
          <input 
            type="number" 
            value={target} 
            onChange={(e) => setTarget(e.target.value)} 
            placeholder="e.g. 5000"
          />
        </div>

        <div className="modal-actions" style={{ flexDirection: 'column', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Check size={20} /> Save Changes
          </button>
          
          {onDelete && (
            <button className="btn btn-ghost" onClick={onDelete} style={{ width: '100%', padding: '12px', border: 'none', color: 'var(--red)', background: 'transparent' }}>
              <Trash2 size={16} style={{ marginRight: '8px' }} /> Delete Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

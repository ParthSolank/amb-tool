'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Wand2,
  LineChart as LineChartIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { AppState } from '@/lib/types';
import SettingsModal from '@/components/SettingsModal';
import AccountModal from '@/components/AccountModal';
import ClearDataModal from '@/components/ClearDataModal';

const DEFAULT_STATE: AppState = {
  accounts: [],
  activeAccountIndex: 0,
  viewMonth: { y: new Date().getFullYear(), m: new Date().getMonth() },
  currency: '₹',
  theme: 'dark'
};

export default function Dashboard() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<'add' | 'edit'>('add');
  const [toast, setToast] = useState<{ msg: string, show: boolean }>({ msg: '', show: false });

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('ambpro_next');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  useEffect(() => {
    if (state !== DEFAULT_STATE) {
      localStorage.setItem('ambpro_next', JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    document.body.dataset.theme = state.theme;
  }, [state.theme]);

  const activeAccount = state.accounts[state.activeAccountIndex] || null;
  const monthKey = `${state.viewMonth.y}-${String(state.viewMonth.m + 1).padStart(2, '0')}`;
  const monthBalances = activeAccount?.months[monthKey] || {};

  const daysInMonth = useMemo(() => {
    return new Date(state.viewMonth.y, state.viewMonth.m + 1, 0).getDate();
  }, [state.viewMonth]);

  const stats = useMemo(() => {
    if (!activeAccount) return null;
    let sum = 0, count = 0;
    const balancesArray: number[] = [];
    const labels: number[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      if (monthBalances[d] !== undefined) {
        sum += monthBalances[d];
        count++;
        balancesArray.push(monthBalances[d]);
        labels.push(d);
      }
    }
    const runAvg = sum / daysInMonth;
    const remaining = daysInMonth - count;
    const needed = remaining > 0 ? Math.max(0, (activeAccount.target * daysInMonth - sum) / remaining) : 0;
    const pct = Math.min(100, Math.round((runAvg / activeAccount.target) * 100));

    // Projection
    let lastBal = 0;
    for (let d = daysInMonth; d >= 1; d--) if (monthBalances[d] !== undefined) { lastBal = monthBalances[d]; break; }
    const projectedAvg = (sum + (lastBal * remaining)) / daysInMonth;
    const buffer = lastBal - ((activeAccount.target * daysInMonth - sum) / (remaining || 1));

    return { runAvg, remaining, needed, pct, count, labels, balancesArray, projectedAvg, buffer };
  }, [activeAccount, monthBalances, daysInMonth]);

  const handleDayInput = (day: number, val: string) => {
    if (!activeAccount) return;
    const numVal = val === '' ? undefined : parseFloat(val);

    setState(prev => {
      const newAccounts = [...prev.accounts];
      const accIndex = prev.activeAccountIndex;
      const acc = { ...newAccounts[accIndex] };
      acc.months = { ...acc.months };
      acc.months[monthKey] = { ...acc.months[monthKey] };

      if (numVal === undefined) {
        delete acc.months[monthKey][day];
      } else {
        acc.months[monthKey][day] = numVal;
      }

      newAccounts[accIndex] = acc;
      return { ...prev, accounts: newAccounts };
    });
  };


  const handleClearData = (scope: 'month' | 'year' | 'all') => {
    if (!activeAccount) return;
    setState(prev => {
      const newAccounts = [...prev.accounts];
      const acc = { ...newAccounts[prev.activeAccountIndex] };
      acc.months = { ...acc.months };

      if (scope === 'month') {
        delete acc.months[monthKey];
      } else if (scope === 'year') {
        const yearPrefix = `${prev.viewMonth.y}-`;
        Object.keys(acc.months).forEach(key => {
          if (key.startsWith(yearPrefix)) delete acc.months[key];
        });
      } else {
        acc.months = {};
      }

      newAccounts[prev.activeAccountIndex] = acc;
      return { ...prev, accounts: newAccounts };
    });

    setIsClearModalOpen(false);
    showToast(`🗑️ Data cleared (${scope})`);
  };

  const autoFillWeekends = () => {
    if (!activeAccount) return;
    setState(prev => {
      const newAccounts = [...prev.accounts];
      const acc = { ...newAccounts[prev.activeAccountIndex] };
      acc.months = { ...acc.months };
      const currentMonthData = { ...acc.months[monthKey] };

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(prev.viewMonth.y, prev.viewMonth.m, d);
        const dow = date.getDay();
        if ((dow === 0 || dow === 6) && currentMonthData[d] === undefined) {
          // Find last available balance
          let lastBal = 0;
          for (let prevD = d - 1; prevD >= 1; prevD--) {
            if (currentMonthData[prevD] !== undefined) {
              lastBal = currentMonthData[prevD];
              break;
            }
          }
          if (lastBal > 0) currentMonthData[d] = lastBal;
        }
      }

      acc.months[monthKey] = currentMonthData;
      newAccounts[prev.activeAccountIndex] = acc;
      return { ...prev, accounts: newAccounts };
    });
    showToast("🪄 Weekends auto-filled");
  };

  const editAccount = (index: number) => {
    setAccountModalMode('edit');
    setIsModalOpen(true);
  };

  const deleteAccount = (index: number) => {
    // We can keep native confirm for now as it's less intrusive than prompt
    if (confirm(`Are you sure you want to delete ${state.accounts[index].name}? All data will be lost.`)) {
      setState(prev => {
        const newAccounts = prev.accounts.filter((_, i) => i !== index);
        return {
          ...prev,
          accounts: newAccounts,
          activeAccountIndex: 0
        };
      });
      setIsModalOpen(false);
      showToast("🗑️ Account deleted");
    }
  };

  const addAccount = () => {
    setAccountModalMode('add');
    setIsModalOpen(true);
  };

  const handleSaveAccount = (name: string, target: number) => {
    setState(prev => {
      const newAccounts = [...prev.accounts];
      if (accountModalMode === 'edit') {
        newAccounts[prev.activeAccountIndex] = {
          ...newAccounts[prev.activeAccountIndex],
          name,
          target
        };
      } else {
        const newAcc: any = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          target,
          color: '#7c6ef7',
          months: {}
        };
        newAccounts.push(newAcc);
      }
      return {
        ...prev,
        accounts: newAccounts,
        activeAccountIndex: accountModalMode === 'add' ? newAccounts.length - 1 : prev.activeAccountIndex
      };
    });
    showToast(accountModalMode === 'edit' ? "✅ Account updated" : "✅ Account added");
  };

  return (
    <main className="app-container">
      <div className="dashboard-layout">
        <div className="sidebar">
          <header className="header">
            <div className="logo">AMB</div>
            <div className="header-actions">
              <button className="icon-btn" onClick={() => setIsClearModalOpen(true)} style={{ color: 'var(--red)' }} title="Clear Data"><Trash2 size={18} /></button>
              <button className="icon-btn" onClick={autoFillWeekends} title="Auto-fill Weekends"><Wand2 size={18} /></button>
              <button className="icon-btn" onClick={() => setIsSettingsOpen(true)} title="Settings"><SettingsIcon size={18} /></button>
            </div>
          </header>

          <section className="month-nav">
            <div>
              <div className="month-label">
                {new Date(state.viewMonth.y, state.viewMonth.m).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
              <div className="month-sub">Financial Tracking</div>
            </div>
            <div className="nav-arrows">
              <button className="nav-btn" onClick={() => setState(p => ({ ...p, viewMonth: { y: p.viewMonth.m === 0 ? p.viewMonth.y - 1 : p.viewMonth.y, m: p.viewMonth.m === 0 ? 11 : p.viewMonth.m - 1 } }))}><ChevronLeft size={16} /></button>
              <button className="nav-btn" onClick={() => setState(p => ({ ...p, viewMonth: { y: p.viewMonth.m === 11 ? p.viewMonth.y + 1 : p.viewMonth.y, m: p.viewMonth.m === 11 ? 0 : p.viewMonth.m + 1 } }))}><ChevronRight size={16} /></button>
            </div>
          </section>

          <div className="accounts-bar">
            {state.accounts.map((acc, i) => (
              <div key={acc.id} className={`account-tab ${i === state.activeAccountIndex ? 'active' : ''}`} onClick={() => setState(p => ({ ...p, activeAccountIndex: i }))}>
                <div className="dot" style={{ background: acc.color }} /> {acc.name}
              </div>
            ))}
            <button className="add-account-btn" onClick={addAccount}>+ Add Account</button>
          </div>

          {activeAccount && stats && (
            <div className="sidebar-stats">
              <div className="stat-card">
                <div className="stat-label">Running avg</div>
                <div className={`stat-value ${stats.runAvg >= activeAccount.target ? 'green' : stats.runAvg >= activeAccount.target * 0.7 ? 'amber' : 'red'}`}>
                  {state.currency}{Math.round(stats.runAvg).toLocaleString()}
                </div>
                <div className="stat-sub" onClick={() => editAccount(state.activeAccountIndex)} style={{ cursor: 'pointer' }}>
                  target {state.currency}{activeAccount.target.toLocaleString()} ✎
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Need/day</div>
                <div className="stat-value">{state.currency}{Math.round(stats.needed).toLocaleString()}</div>
                <div className="stat-sub">{stats.remaining} days left</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">AMB progress</div>
                <div className="stat-value">{stats.pct}%</div>
                <div className="progress-track" style={{ marginTop: '10px' }}>
                  <div className={`progress-fill ${stats.pct >= 100 ? 'green' : stats.pct >= 70 ? '' : 'red'}`} style={{ width: `${stats.pct}%` }}></div>
                </div>
              </div>

              <div className="insights-card">
                <div className="insights-title">✨ Smart Insights</div>
                <div className="insights-grid">
                  <div className="insight-item">
                    <div className="insight-label">Projected AMB</div>
                    <div className={`insight-value ${stats.projectedAvg >= activeAccount.target ? 'plus' : 'minus'}`}>
                      {state.currency}{Math.round(stats.projectedAvg).toLocaleString()}
                    </div>
                  </div>
                  <div className="insight-item">
                    <div className="insight-label">Safety Buffer</div>
                    <div className={`insight-value ${stats.buffer >= 0 ? 'plus' : 'minus'}`}>
                      {stats.buffer >= 0 ? '+' : ''}{state.currency}{Math.round(stats.buffer).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="main-content">
          {activeAccount && stats ? (
            <>
              <div className="cal-wrap">
                <div className="cal-header">
                  <span>Daily balances</span>
                  <span style={{ color: 'var(--accent)' }}>{stats.count} days</span>
                </div>
                <div className="cal-grid">
                  {Array.from({ length: new Date(state.viewMonth.y, state.viewMonth.m, 1).getDay() }).map((_, i) => <div key={`e-${i}`} className="day-cell empty" />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const v = monthBalances[d];
                    return (
                      <div key={d} className={`day-cell ${v !== undefined ? (v >= activeAccount.target ? 'good' : 'filled') : ''}`}>
                        <div className="day-num">{d}</div>
                        <input type="number" value={v === undefined ? '' : v} onChange={(e) => handleDayInput(d, e.target.value)} placeholder={state.currency} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="status-bar">
                <AlertCircle size={18} />
                <div className="status-text">
                  {stats.runAvg >= activeAccount.target
                    ? <>Maintaining <strong>Target AMB</strong></>
                    : <><strong>{state.currency}{Math.round(activeAccount.target - stats.runAvg).toLocaleString()}</strong> away from target</>
                  }
                </div>
              </div>
            </>
          ) : (
            <div className="welcome-area">
              <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <div className="status-text"><strong>Welcome!</strong> Add an account to start tracking.</div>
            </div>
          )}
        </div>
      </div>

      <ClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onClear={handleClearData}
        monthName={new Date(state.viewMonth.y, state.viewMonth.m).toLocaleString('default', { month: 'long' })}
        year={state.viewMonth.y}
      />

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAccount}
        onDelete={accountModalMode === 'edit' ? () => deleteAccount(state.activeAccountIndex) : undefined}
        title={accountModalMode === 'edit' ? 'Edit Account' : 'Add New Account'}
        initialName={accountModalMode === 'edit' ? activeAccount?.name : ''}
        initialTarget={accountModalMode === 'edit' ? activeAccount?.target : 0}
      />

      <SettingsModal
        state={state}
        setState={setState}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showToast={showToast}
      />

      <div className={`toast ${toast.show ? 'show' : ''}`}>{toast.msg}</div>
    </main>
  );
}

import React, { useState, useEffect } from 'react';

const CONFIG = {
  success: { icon: '✅', bg: '#ecfdf5', border: '#10b981', text: '#047857', bar: '#10b981' },
  error:   { icon: '❌', bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', bar: '#ef4444' },
  warning: { icon: '⚠️', bg: '#fffbeb', border: '#f59e0b', text: '#b45309', bar: '#f59e0b' },
  coin:    { icon: '💰', bg: '#fefce8', border: '#f59e0b', text: '#92400e', bar: '#f59e0b' },
  reward:  { icon: '🎁', bg: '#f5f3ff', border: '#8b5cf6', text: '#6d28d9', bar: '#8b5cf6' },
  booking: { icon: '🎮', bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', bar: '#3b82f6' },
};

const DURATION = 3400;

const ToastItem = ({ message, type, onRemove }) => {
  const c = CONFIG[type] || CONFIG.success;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), DURATION - 400);
    const t2 = setTimeout(onRemove, DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      background: c.bg,
      border: `1.5px solid ${c.border}`,
      color: c.text,
      padding: '14px 18px 14px 16px',
      borderRadius: '18px',
      fontSize: '14px',
      fontWeight: 800,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxShadow: `0 8px 28px rgba(0,0,0,0.10), 0 0 0 1px ${c.border}22`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      maxWidth: '320px',
      minWidth: '220px',
      lineHeight: 1.4,
      position: 'relative',
      overflow: 'hidden',
      animation: visible ? 'toastIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards' : 'toastOut 0.35s ease-in forwards',
      pointerEvents: 'auto',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {/* progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: '3px',
        background: c.bar, borderRadius: '0 0 18px 18px',
        animation: `toastBar ${DURATION}ms linear forwards`,
        width: '100%',
      }} />
    </div>
  );
};

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      setToasts(prev => [...prev.slice(-4), e.detail]);
    };
    window.addEventListener('mavikent-toast', handler);
    return () => window.removeEventListener('mavikent-toast', handler);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '24px',
      zIndex: 99999, display: 'flex', flexDirection: 'column-reverse',
      gap: '10px', pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes toastIn  { from { opacity:0; transform:translateX(50px) scale(0.92); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes toastOut { from { opacity:1; transform:translateX(0) scale(1); }        to { opacity:0; transform:translateX(50px) scale(0.92); } }
        @keyframes toastBar { from { transform:scaleX(1); transform-origin:left; } to { transform:scaleX(0); transform-origin:left; } }
      `}</style>
      {toasts.map(t => (
        <ToastItem key={t.id} message={t.message} type={t.type} onRemove={() => remove(t.id)} />
      ))}
    </div>
  );
};

export default Toast;

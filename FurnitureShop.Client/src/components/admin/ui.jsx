// src/components/admin/ui.jsx — TailAdmin Executive Luxury Primitives (Tailwind v4)
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

/* ── Page Header ─────────────────────────────── */
export const PageHeader = ({ title, subtitle, breadcrumb, children }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 mb-6 font-['Outfit']">
    <div>
      {breadcrumb && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 uppercase tracking-wider mb-1 font-medium">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-zinc-300">›</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-zinc-800 font-bold' : 'text-zinc-400'}>{b}</span>
            </span>
          ))}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-tight text-[#0D0D0D] leading-tight">{title}</h1>
      {subtitle && <p className="text-xs text-zinc-500 mt-1 font-light">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
  </div>
);

/* ── Buttons ─────────────────────────────────── */
export const Btn = ({ children, onClick, disabled, variant = 'primary', size = 'md', type = 'button', className = '', style }) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-xs rounded-xl gap-2',
    lg: 'px-6 py-3 text-sm rounded-2xl gap-2.5',
  };
  
  const variants = {
    primary: 'bg-[#0D0D0D] text-[#FDFBF7] border border-[#0D0D0D] hover:bg-[#C9A87C] hover:text-[#0D0D0D] hover:border-[#C9A87C] shadow-sm',
    danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-700 shadow-sm',
    outline: 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400',
    ghost: 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800',
  };

  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`inline-flex items-center justify-center font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none font-['Outfit'] ${s} ${v} ${className}`}
    >
      {children}
    </button>
  );
};

/* ── Filters bar ─────────────────────────────── */
export const Filters = ({ children }) => (
  <div className="flex flex-wrap items-center gap-3 mb-5">
    {children}
  </div>
);

export const SearchInput = ({ value, onChange, placeholder = 'Tìm kiếm...' }) => (
  <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3.5 py-2 min-w-[240px] flex-1 focus-within:border-[#0D0D0D] focus-within:ring-2 focus-within:ring-[#0D0D0D]/5 transition-all shadow-xs">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full text-xs text-zinc-800 focus:outline-none bg-transparent font-['Outfit'] placeholder:text-zinc-400"
    />
  </div>
);

export const FilterSelect = ({ value, onChange, options = [], placeholder, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-700 font-medium cursor-pointer focus:outline-none focus:border-[#0D0D0D] transition-all shadow-xs font-['Outfit'] min-w-[140px]"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children ? children : (Array.isArray(options) ? options : []).map((o, i) => (
      <option key={i} value={o?.value ?? o}>{o?.label ?? o}</option>
    ))}
  </select>
);

/* ── Table Card ──────────────────────────────── */
export const TableCard = ({ children, title, action }) => (
  <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-[0_2px_16px_rgba(13,13,13,0.03)] overflow-hidden transition-all duration-300">
    {(title || action) && (
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
        {title && <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] font-['Outfit'] m-0">{title}</h3>}
        {action}
      </div>
    )}
    <div className="overflow-x-auto">
      {children}
    </div>
  </div>
);

/* ── Table ───────────────────────────────────── */
export const Table = ({ children }) => (
  <table className="w-full text-left border-collapse min-w-[640px]">
    {children}
  </table>
);

export const Thead = ({ children }) => (
  <thead className="bg-zinc-50/80 border-b border-zinc-200/80">
    {children}
  </thead>
);

export const Th = ({ children, sortable, onSort, sorted, align = 'left' }) => {
  const aligns = { left: 'text-left', center: 'text-center', right: 'text-right' };
  return (
    <th
      onClick={sortable ? onSort : undefined}
      className={`px-5 py-3.5 text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-['Outfit'] select-none ${aligns[align] || 'text-left'} ${sortable ? 'cursor-pointer hover:text-black transition-colors' : ''}`}
    >
      <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span>{children}</span>
        {sortable && (
          <span className="text-[10px] opacity-60">
            {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </div>
    </th>
  );
};

export const Td = ({ children, style, className = '', align = 'left', colSpan }) => {
  const aligns = { left: 'text-left', center: 'text-center', right: 'text-right' };
  return (
    <td
      colSpan={colSpan}
      style={style}
      className={`px-5 py-4 text-xs text-zinc-700 border-b border-zinc-100 font-['Outfit'] ${aligns[align] || 'text-left'} ${className}`}
    >
      {children}
    </td>
  );
};

/* ── Status Badge ────────────────────────────── */
export const Badge = ({ variant = 'default', children }) => {
  const variants = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    unpaid: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    customer: 'bg-sky-50 text-sky-700 border-sky-200',
    solved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-orange-50 text-orange-800 border-orange-200',
    default: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  };

  const v = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wide border ${v}`}>
      {children}
    </span>
  );
};

/* ── Action buttons ──────────────────────────── */
export const ActionBtn = ({ onClick, title, variant = 'edit', disabled, children }) => {
  const variants = {
    edit: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    delete: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    view: 'bg-sky-50 text-sky-600 hover:bg-sky-100',
    next: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    reset: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    lock: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    unlock: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
  };

  const v = variants[variant] || variants.edit;

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${v}`}
    >
      {children}
    </button>
  );
};

/* ── Pagination ──────────────────────────────── */
export const Pagination = ({ currentPage, totalPages, onPrev, onNext, onPage }) => {
  const pages = [];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-white font-['Outfit']">
      <span className="text-xs text-zinc-500">
        Trang <strong className="text-zinc-800 font-mono">{currentPage}</strong> / <strong className="text-zinc-800 font-mono">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          ‹
        </button>
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPage?.(p)}
            className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
              p === currentPage
                ? 'bg-[#0D0D0D] text-[#FDFBF7] shadow-xs'
                : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          ›
        </button>
      </div>
    </div>
  );
};

/* ── Loading / Empty / Error ─────────────────── */
export const TableState = ({ type = 'loading', colSpan = 8, message }) => (
  <tr>
    <td colSpan={colSpan} className="py-12 text-center text-xs text-zinc-500 font-['Outfit']">
      {type === 'loading' ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#0D0D0D] rounded-full animate-spin" />
          <span className="uppercase tracking-widest font-bold text-[10px] text-zinc-400">{message || 'Đang tải dữ liệu...'}</span>
        </div>
      ) : (
        <span className={type === 'error' ? 'text-rose-600 font-semibold' : 'text-zinc-400'}>
          {message || (type === 'error' ? 'Có lỗi xảy ra khi tải dữ liệu' : 'Không có dữ liệu hiển thị')}
        </span>
      )}
    </td>
  </tr>
);

/* ── Modal ───────────────────────────────────── */
export const Modal = ({ show, onClose, title, children, size = 'md' }) => {
  if (!show || typeof document === 'undefined') return null;
  const maxWs = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-['Outfit']"
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-white rounded-2xl w-full ${maxWs[size] || 'max-w-lg'} max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-200 animate-fade-up my-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 shrink-0">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all cursor-pointer text-sm font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-left">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ── Form primitives ─────────────────────────── */
export const FormBody = ({ children, onSubmit }) => (
  <form onSubmit={onSubmit} className="space-y-4 font-['Outfit']">
    {children}
  </form>
);

export const FormRow = ({ children, cols = 2 }) => {
  const colClasses = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3' };
  return (
    <div className={`grid ${colClasses[cols] || 'grid-cols-1 sm:grid-cols-2'} gap-4`}>
      {children}
    </div>
  );
};

export const FormGroup = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5 font-['Outfit']">
    {label && (
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-rose-500 font-bold">*</span>}
      </label>
    )}
    {children}
  </div>
);

export const FormInput = (props) => (
  <input
    {...props}
    className={`w-full px-3.5 py-2.5 text-xs text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#0D0D0D] focus:ring-2 focus:ring-[#0D0D0D]/5 transition-all font-['Outfit'] placeholder:text-zinc-400 ${props.className || ''}`}
  />
);

export const FormSelect = ({ children, ...props }) => (
  <select
    {...props}
    className={`w-full px-3.5 py-2.5 text-xs text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#0D0D0D] focus:ring-2 focus:ring-[#0D0D0D]/5 transition-all font-['Outfit'] cursor-pointer ${props.className || ''}`}
  >
    {children}
  </select>
);

export const FormTextarea = (props) => (
  <textarea
    {...props}
    className={`w-full px-3.5 py-2.5 text-xs text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#0D0D0D] focus:ring-2 focus:ring-[#0D0D0D]/5 transition-all font-['Outfit'] min-h-[96px] placeholder:text-zinc-400 ${props.className || ''}`}
  />
);

export const FormCheckbox = ({ label, ...props }) => (
  <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-zinc-700 font-medium select-none font-['Outfit']">
    <input
      type="checkbox"
      {...props}
      className="w-4 h-4 rounded border-zinc-300 text-[#0D0D0D] focus:ring-[#0D0D0D]/10 cursor-pointer accent-[#0D0D0D]"
    />
    <span>{label}</span>
  </label>
);

export const FormActions = ({ children }) => (
  <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
    {children}
  </div>
);

export const FormError = ({ message }) =>
  message ? (
    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium font-['Outfit'] animate-fade-in">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  ) : null;

export const FormSectionTitle = ({ children }) => (
  <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 pb-2 border-b border-zinc-100 m-0 pt-2 font-['Outfit']">
    {children}
  </h3>
);

/* ── Stat Card ───────────────────────────────── */
export const StatCard = ({ label, value, sub, trend, trendLabel, icon }) => (
  <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_2px_12px_rgba(13,13,13,0.02)] transition-all duration-300 hover:border-zinc-300 font-['Outfit'] group">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 block">{label}</span>
        <span className="text-2xl sm:text-3xl font-mono font-light tracking-tight text-[#0D0D0D] block tabular-nums leading-none pt-1">{value}</span>
        {sub && <span className="text-xs text-zinc-500 block pt-1 font-light">{sub}</span>}
      </div>
      {icon && (
        <div className="w-11 h-11 rounded-xl bg-zinc-100 text-[#0D0D0D] flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110 flex-shrink-0 shadow-2xs">
          {icon}
        </div>
      )}
    </div>
    {trend !== undefined && (
      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-zinc-100">
        <span className={`text-xs font-mono font-bold inline-flex items-center ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
        </span>
        {trendLabel && <span className="text-[11px] text-zinc-400 font-light">{trendLabel}</span>}
      </div>
    )}
  </div>
);

/* ── Confirm Action Toast ────────────────────── */
export const confirmAction = (message, confirmText = 'Đồng ý', confirmVariant = 'danger') => new Promise((resolve) => {
  const btnClass = confirmVariant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0D0D0D] hover:bg-[#C9A87C] hover:text-[#0D0D0D]';
  toast((t) => (
    <div className="font-['Outfit'] max-w-sm p-1">
      <p className="text-sm font-medium text-zinc-800 m-0 leading-relaxed">{message}</p>
      <div className="flex gap-2 justify-end mt-4">
        <button
          onClick={() => { toast.dismiss(t.id); resolve(false); }}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={() => { toast.dismiss(t.id); resolve(true); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-all shadow-xs ${btnClass}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  ), { duration: Infinity, position: 'top-center' });
});

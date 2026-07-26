import { CheckIcon, FilterIcon, XIcon } from './Icons';

export * from './Icons';

export const tableTh =
  'px-1.5 py-1.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wide';
export const tableTd =
  'px-1.5 py-1 text-xs text-slate-800 align-middle';
export const tableClass =
  'w-full table-fixed divide-y divide-slate-200 text-slate-900';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, icon: IconComp, children, subtitle }) {
  return (
    <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {IconComp && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <IconComp className="w-4 h-4" />
          </span>
        )}
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: IconComp,
  className = '',
  disabled,
  ...props
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white',
  };
  const sizes = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {IconComp && <IconComp className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

export function IconButton({ icon: IconComp, label, variant = 'ghost', className = '', ...props }) {
  const variants = {
    ghost: 'text-slate-500 hover:text-blue-600 hover:bg-blue-50',
    success: 'text-emerald-600 hover:bg-emerald-50',
    danger: 'text-red-600 hover:bg-red-50',
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`p-1 rounded-md transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      <IconComp className="w-3.5 h-3.5" />
    </button>
  );
}

export function Input({ icon: IconComp, className = '', ...props }) {
  return (
    <div className="relative">
      {IconComp && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <IconComp className="w-3.5 h-3.5" />
        </span>
      )}
      <input
        className={`form-control w-full text-slate-900 ${IconComp ? 'form-control--with-icon' : ''} ${className}`}
        {...props}
      />
    </div>
  );
}

export function Select({ children, className = '', ...props }) {
  return (
    <div className="relative">
      <select className={`form-control form-select w-full text-slate-900 ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

export function Checkbox({ label, description, className = '', ...props }) {
  return (
    <label className={`inline-flex items-start gap-2 cursor-pointer group ${className}`}>
      <input type="checkbox" className="form-checkbox mt-0.5" {...props} />
      <span className="flex flex-col">
        {label && <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">{label}</span>}
        {description && <span className="text-[10px] text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

export function FilterField({ label, icon: IconComp, children }) {
  return (
    <div className="min-w-0">
      <label className="filter-label">
        {IconComp && <IconComp className="w-3 h-3 text-slate-400" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterBar({ children, onClear, resultText }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <FilterIcon className="w-3.5 h-3.5" />
        Filters
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {resultText && <p className="text-xs text-slate-500">{resultText}</p>}
        {onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-violet-100 text-violet-800',
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function Alert({ children, type = 'info' }) {
  const types = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };
  return (
    <div className={`px-3 py-2 rounded-lg border text-sm ${types[type]}`}>{children}</div>
  );
}

export function StatCard({ label, value, icon: IconComp, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[color]}`}>
          <IconComp className="w-4 h-4" />
        </span>
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function TabPills({ options, value, onChange }) {
  return (
    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            value === opt.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function InlineEditActions({ onSave, onCancel }) {
  return (
    <span className="inline-flex gap-0.5 shrink-0">
      <IconButton icon={CheckIcon} label="Save" variant="success" onClick={onSave} />
      <IconButton icon={XIcon} label="Cancel" variant="danger" onClick={onCancel} />
    </span>
  );
}

export function DataTable({ children }) {
  return (
    <div className="overflow-hidden">
      <table className={tableClass}>{children}</table>
    </div>
  );
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange, loading }) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-500 tabular-nums">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-slate-600 tabular-nums px-1">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

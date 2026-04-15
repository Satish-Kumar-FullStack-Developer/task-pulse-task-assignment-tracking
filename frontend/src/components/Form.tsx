import { ReactNode } from 'react';

export const Alert = ({ type = 'info', children, className = '' }: { type?: 'info' | 'success' | 'error' | 'warning'; children: ReactNode; className?: string }) => {
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div className={`p-4 border rounded-lg ${colors[type]} ${className}`}>
      {children}
    </div>
  );
}

export const Badge = ({ color = 'gray', children }: { color?: string; children: ReactNode }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-medium ${colors[color] || colors.gray}`}>{children}</span>;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-300',
    danger: 'bg-danger-600 text-white hover:bg-danger-500 disabled:bg-gray-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors ${variants[variant]} ${sizes[size]} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
}

export const Input = ({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <input className="input" {...props} />
    </div>
  );
}

export const Select = ({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Array<{ value: string; label: string }>;
}) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <select className="input" {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export const Textarea = ({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <textarea className="input resize-none" rows={4} {...props} />
    </div>
  );
}

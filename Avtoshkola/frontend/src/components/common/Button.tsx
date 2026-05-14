import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  children: ReactNode;
}

const variantCls: Record<Variant, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost:     'text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
};

const sizeCls: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantCls[variant],
        sizeCls[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {isLoading ? <Spinner className="h-4 w-4" /> : leftIcon}
      {children}
    </button>
  );
}

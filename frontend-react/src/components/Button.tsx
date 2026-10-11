import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'yellow' | 'ghost';
export function Button({ variant = 'primary', children, className = '', ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & { variant?: Variant }) {
  return <button className={`btn ${variant} ${className}`} {...props}>{children}</button>;
}

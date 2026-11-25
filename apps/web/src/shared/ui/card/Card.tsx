import type { ComponentPropsWithRef } from 'react';
import './card.css';

export function Card({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      {...props}
      className={`angia-card min-w-0 rounded-[20px] border border-border bg-surface p-4 font-sans text-body text-text-primary shadow-card ${className}`}
    />
  );
}

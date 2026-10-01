import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const variants = cva('button', { variants: { variant: { default: 'button-primary', outline: 'button-outline', ghost: 'button-ghost', destructive: 'button-destructive' } }, defaultVariants: { variant: 'default' } });
export function Button({ className, variant, asChild = false, loading = false, disabled, onClick, ...props }: React.ComponentProps<'button'> & VariantProps<typeof variants> & { asChild?: boolean; loading?: boolean }) {
  const Component = asChild ? Slot : 'button';
  return <Component className={cn(variants({ variant }), className)} {...props}
    disabled={asChild ? undefined : disabled || loading}
    aria-disabled={asChild && (disabled || loading) ? true : props['aria-disabled']}
    aria-busy={loading || props['aria-busy']}
    data-loading={loading || undefined}
    onClick={event => { if (disabled || loading) { event.preventDefault(); return; } onClick?.(event); }} />;
}

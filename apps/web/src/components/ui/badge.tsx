import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium',
  {
    variants: {
      variant: {
        neutral: 'border-line-strong bg-ground text-muted',
        accent: 'border-transparent bg-accent-soft text-accent-ink',
        good: 'border-score-good bg-ground text-score-good',
        warn: 'border-score-warn bg-ground text-score-warn',
        bad: 'border-score-bad bg-ground text-score-bad',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

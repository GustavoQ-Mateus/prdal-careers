import * as React from 'react';
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type TooltipContentProps,
  type TooltipProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<string, { label: string; color: string }>;

const ChartConfigContext = React.createContext<ChartConfig>({});

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ChartConfigContext.Provider value={config}>
      <div
        className={cn('h-[260px] w-full min-w-0', className)}
        style={Object.fromEntries(Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color])) as React.CSSProperties}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartConfigContext.Provider>
  );
}

export function ChartTooltip({
  content,
  ...props
}: TooltipProps<ValueType, NameType> & { content?: React.ReactElement }) {
  return <RechartsTooltip {...props} content={content ?? ((tooltipProps: TooltipContentProps<ValueType, NameType>) => <ChartTooltipContent {...tooltipProps} />)} />;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  const config = React.useContext(ChartConfigContext);
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border border-line bg-ground px-3 py-2 text-[12px] shadow-rest">
      <p className="mb-1 font-mono text-faint">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? '');
          const nome = config[key]?.label ?? item.name ?? key;
          return (
            <div key={key} className="flex items-center justify-between gap-5 text-ink-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
                {nome}
              </span>
              <strong className="font-mono font-medium tabular-nums text-ink">{item.value ?? '--'}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

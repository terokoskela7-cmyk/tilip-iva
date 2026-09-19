import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: string;
  valueClassName?: string;
  hint?: string;
  icon?: ReactNode;
}

/**
 * Tunnusluku yhdessa ruudussa.
 *
 * Kapealla naytolla nimike ja arvo ovat samalla rivilla, jolloin kolme lukua
 * mahtuu nakymaan kerralla. Korttikomponentin oletustayteilla sama kolmikko
 * vei yli kaksi ruudullista pystysuunnassa.
 */
export function StatTile({ label, value, valueClassName, hint, icon }: StatTileProps) {
  return (
    <div className="rounded-lg border bg-white p-3 flex items-baseline justify-between gap-3 sm:block sm:p-4">
      <p className="text-xs text-gray-500 sm:text-sm flex items-center gap-1.5 flex-shrink-0">
        {icon}
        {label}
      </p>
      <div className="text-right min-w-0 sm:text-left sm:mt-1">
        <p className={`text-base font-bold tabular-nums sm:text-2xl ${valueClassName ?? 'text-gray-900'}`}>
          {value}
        </p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}

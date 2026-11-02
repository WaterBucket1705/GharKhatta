import React, { useState } from 'react';
import { HelpCircle, X, Calculator } from 'lucide-react';

export interface InfoPopupItem {
  label: string;
  value?: string;
  highlight?: 'emerald' | 'amber' | 'rose' | 'neutral';
}

interface InfoPopupButtonProps {
  title: string;
  subtitle?: string;
  formula?: string;
  description: string;
  bullets?: string[];
  breakdownItems?: InfoPopupItem[];
  buttonLabel?: string;
}

export const InfoPopupButton: React.FC<InfoPopupButtonProps> = ({
  title,
  subtitle,
  formula,
  description,
  bullets,
  breakdownItems,
  buttonLabel,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Info: ${title}`}
        title={`Info: ${title}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium text-stone-500 hover:text-emerald-800 hover:bg-emerald-50/80 border border-transparent hover:border-emerald-200 transition-colors shrink-0"
      >
        <HelpCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        {buttonLabel && <span>{buttonLabel}</span>}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-left"
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                {subtitle && (
                  <p className="text-[11px] font-semibold text-emerald-700">{subtitle}</p>
                )}
                <h3 className="text-base font-bold text-stone-900">{title}</h3>
              </div>
              <button
                type="button"
                aria-label="Close explanation popup"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">{description}</p>

            {formula && (
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-1">
                <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Exact Calculation Formula</span>
                </span>
                <p className="text-xs font-mono-num font-semibold text-stone-900 leading-relaxed">
                  {formula}
                </p>
              </div>
            )}

            {breakdownItems && breakdownItems.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2 text-xs">
                {breakdownItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span className="text-stone-600">{item.label}</span>
                    {item.value && (
                      <span
                        className={`font-mono-num font-semibold ${
                          item.highlight === 'emerald'
                            ? 'text-emerald-700'
                            : item.highlight === 'amber'
                            ? 'text-amber-700'
                            : item.highlight === 'rose'
                            ? 'text-rose-600'
                            : 'text-stone-900'
                        }`}
                      >
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {bullets && bullets.length > 0 && (
              <ul className="space-y-1.5 text-xs text-stone-700">
                {bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

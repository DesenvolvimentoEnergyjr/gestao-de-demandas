'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export const Select = ({ 
  label, 
  value, 
  onChange, 
  children, 
  className,
  placeholder = "Selecione uma opção" 
}: SelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Extract options from children
  const options = React.useMemo(() => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const { value, children: label } = child.props;
        return { value, label };
      }
      return null;
    })?.filter(Boolean) || [];
  }, [children]);

  const selectedOption = options.find(opt => opt?.value === value) || null;

  // Handle click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div className="space-y-3 w-full" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full bg-black border border-white/[0.03] rounded-xl h-12 px-4 text-sm text-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all font-bold pr-10 flex items-center justify-between text-left group',
            isOpen && 'border-secondary ring-4 ring-secondary/5',
            className
          )}
        >
          <span className={cn(!selectedOption && 'text-zinc-700 font-medium')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 text-zinc-500 transition-transform duration-300",
            isOpen ? "rotate-180 text-secondary" : "group-hover:text-zinc-300"
          )} />
        </button>

        {/* Custom Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-2 bg-[#1c1c1c] border border-white/[0.08] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-[240px] overflow-y-auto no-scrollbar py-2">
              {options.length > 0 ? (
                options.map((opt) => (
                  <button
                    key={opt?.value}
                    type="button"
                    onClick={() => handleSelect(opt?.value)}
                    className={cn(
                      "w-full px-4 py-3 text-sm text-left font-bold transition-all flex items-center justify-between group/item",
                      opt?.value === value 
                        ? "bg-secondary/10 text-secondary" 
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    )}
                  >
                    {opt?.label}
                    {opt?.value === value && (
                       <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(11,175,77,0.8)]" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">
                  Nenhuma opção
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Selecione uma data',
  className,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : undefined;

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Gerar dias do calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-xl border border-white/5 bg-zinc-950 px-5 py-2 text-sm text-white cursor-pointer transition-all hover:border-white/10 group',
          isOpen && 'border-secondary/50 ring-1 ring-secondary/20',
          error && 'border-red-500/50',
          className
        )}
      >
        <span className={cn(!value && 'text-zinc-600 font-medium')}>
          {value ? format(parseISO(value), "dd 'de' MMMM, yyyy", { locale: ptBR }) : placeholder}
        </span>
        <CalendarIcon className={cn(
          "w-4 h-4 transition-colors",
          isOpen ? "text-secondary" : "text-zinc-600 group-hover:text-zinc-400"
        )} />
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[150] w-[300px] bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h4>
            <div className="flex gap-1">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); prevMonth(); }}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); nextMonth(); }}
                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day, i) => (
              <div key={i} className="text-center text-[10px] font-black text-zinc-700 h-8 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const today = isToday(day);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDateSelect(day); }}
                  className={cn(
                    'h-9 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center',
                    !isCurrentMonth && 'text-zinc-800 pointer-events-none opacity-20',
                    isCurrentMonth && !isSelected && 'text-zinc-400 hover:bg-white/5 hover:text-white',
                    isSelected && 'bg-secondary text-white shadow-[0_0_15px_rgba(11,175,77,0.4)]',
                    today && !isSelected && 'text-secondary ring-1 ring-secondary/30'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDateSelect(new Date()); }}
              className="text-[10px] font-black text-secondary uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              Hoje
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

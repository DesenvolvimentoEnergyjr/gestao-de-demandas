import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Copied from KanbanCard for identical coloring logic
const genericTagColors = [
  'text-tag-1 bg-tag-1/10 border-tag-1/20',
  'text-tag-2 bg-tag-2/10 border-tag-2/20',
  'text-tag-3 bg-tag-3/10 border-tag-3/20',
  'text-tag-4 bg-tag-4/10 border-tag-4/20',
  'text-tag-5 bg-tag-5/10 border-tag-5/20',
  'text-tag-6 bg-tag-6/10 border-tag-6/20',
  'text-tag-7 bg-tag-7/10 border-tag-7/20',
  'text-tag-8 bg-tag-8/10 border-tag-8/20',
  'text-tag-9 bg-tag-9/10 border-tag-9/20',
  'text-tag-10 bg-tag-10/10 border-tag-10/20',
  'text-tag-11 bg-tag-11/10 border-tag-11/20',
  'text-tag-12 bg-tag-12/10 border-tag-12/20',
  'text-tag-13 bg-tag-13/10 border-tag-13/20',
  'text-tag-14 bg-tag-14/10 border-tag-14/20',
  'text-tag-15 bg-tag-15/10 border-tag-15/20',
  'text-tag-16 bg-tag-16/10 border-tag-16/20',
];

export function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % genericTagColors.length;
  return genericTagColors[index];
}

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export const TagsInput: React.FC<TagsInputProps> = ({ tags, onChange, disabled }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.div
              key={tag}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
                getTagColor(tag)
              )}
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="p-0.5 hover:bg-black/20 rounded-full transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {tags.length === 0 && disabled && (
          <div className="flex items-center gap-2 text-zinc-600 px-1 py-1">
            <Tag className="w-3 h-3 opacity-30" />
            <span className="text-[9px] font-black uppercase tracking-widest italic opacity-40">Sem tags</span>
          </div>
        )}
      </div>

      {!disabled && (
        <div className="relative flex items-center">
          <Tag className="absolute left-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddTag}
            placeholder="Adicionar tag"
            className="w-full h-11 bg-zinc-950 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-secondary transition-colors"
          />
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Attachment } from '@/types';
import { FileText, Table, Presentation, Image as ImageIcon, File, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DriveAttachmentProps {
  attachment: Attachment;
  onRemove?: (id: string) => void;
  isReadOnly?: boolean;
}

const getMimeTypeConfig = (mimeType: string) => {
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
    return { icon: Table, color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  }
  if (mimeType.includes('document') || mimeType.includes('word')) {
    return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' };
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return { icon: Presentation, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  }
  if (mimeType.includes('pdf')) {
    return { icon: FileText, color: 'text-red-400', bg: 'bg-red-400/10' };
  }
  if (mimeType.includes('image')) {
    return { icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-400/10' };
  }
  return { icon: File, color: 'text-zinc-400', bg: 'bg-zinc-400/10' };
};

export const DriveAttachment: React.FC<DriveAttachmentProps> = ({ attachment, onRemove, isReadOnly }) => {
  const { icon: Icon, color, bg } = getMimeTypeConfig(attachment.mimeType);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex items-center h-10 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl overflow-hidden transition-all pr-2 max-w-[240px]"
    >
      <a 
        href={attachment.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-3 flex-1 min-w-0 pl-1 py-1 h-full hover:bg-white/5 transition-colors"
        title="Abrir documento no Drive"
      >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-0.5", bg)}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <span className="text-[11px] font-bold text-zinc-300 truncate group-hover:text-white transition-colors">
            {attachment.name}
          </span>
          <span className="text-[8px] font-medium text-zinc-600 uppercase tracking-widest flex items-center gap-1 mt-0.5">
            Abrir
            <ExternalLink className="w-2 h-2" />
          </span>
        </div>
      </a>

      {!isReadOnly && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(attachment.id);
          }}
          className="w-7 h-7 ml-1 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 opacity-0 group-hover:opacity-100"
          title="Remover anexo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
};

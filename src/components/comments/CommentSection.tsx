import React, { useState, useEffect } from 'react';
import { User, Comment } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { MentionInput } from './MentionInput';
import { addCommentToDemand, deleteCommentFromDemand } from '@/lib/firestore';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from '@/store/useToastStore';
import { MessageSquare, Send, Trash2, AlertCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CommentSectionProps {
  demandId: string;
  demandTitle: string;
  allUsers: User[];
  currentUser: User | null;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  demandId,
  demandTitle,
  allUsers,
  currentUser,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!demandId) return;
    const unsub = onSnapshot(doc(db, 'demands', demandId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setComments(data.comments || []);
      }
    });
    return () => unsub();
  }, [demandId]);

  const handleSubmit = async (text: string, mentionedUsers: User[]) => {
    if (!currentUser || !text.trim()) return;

    setIsSubmitting(true);
    try {
      const mentionedIds = mentionedUsers.map(u => u.uid);
      await addCommentToDemand(demandId, text.trim(), currentUser.uid, mentionedIds, demandTitle);

      setNewComment('');
      toast.success('Comentário enviado!');
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      toast.error('Ocorreu um erro ao enviar o comentário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteCommentFromDemand(demandId, commentToDelete);
      toast.success('Comentário removido!');
    } catch (error) {
      console.error('Erro ao remover comentário:', error);
      toast.error('Ocorreu um erro ao remover.');
    } finally {
      setCommentToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-8 pt-8 border-t border-white/5">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-secondary" />
        <h3 className="text-sm font-black text-white uppercase tracking-widest">
          Comentários ({comments.length})
        </h3>
      </div>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-zinc-950/30">
            <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nenhum comentário</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.slice().sort((a, b) => {
              // Ensure sorting by date ascending
              const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || Date.now()));
              const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || Date.now()));
              return dateA.getTime() - dateB.getTime();
            }).map((comment) => {
              const author = allUsers.find((u) => u.uid === comment.authorId);
              const date = (comment.createdAt as any)?.toDate ? (comment.createdAt as any).toDate() : (comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt || Date.now()));

              // Helper to style mentions
              const renderTextWithMentions = (text: string) => {
                if (allUsers.length === 0) return <span key={0}>{text}</span>;
                
                const mentionNames = allUsers.map(u => u.name).sort((a, b) => b.length - a.length);
                const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`(@(?:${mentionNames.map(escapeRegExp).join('|')}))`, 'g');
                
                const parts = text.split(pattern);
                
                return parts.map((part, i) => {
                  if (part.startsWith('@')) {
                    const name = part.substring(1);
                    if (mentionNames.includes(name)) {
                      return <span key={i} className="text-secondary font-bold bg-secondary/10 px-1 rounded">{part}</span>;
                    }
                  }
                  return <span key={i}>{part}</span>;
                });
              };

              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar
                    src={author?.photoURL}
                    alt={author?.name}
                    fallback={author?.name?.charAt(0)}
                    size="sm"
                    className="mt-1"
                  />
                  <div className="flex-1 bg-zinc-950/50 border border-white/5 rounded-2xl rounded-tl-none p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{author?.name || 'Usuário Desconhecido'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-medium">{formatRelativeTime(date)}</span>
                        {currentUser?.role === 'diretor' && (
                          <button
                            type="button"
                            onClick={() => setCommentToDelete(comment.id)}
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                            title="Remover comentário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {renderTextWithMentions(comment.text)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-3 bg-zinc-950 p-2 pr-2 rounded-2xl border border-white/5 focus-within:border-secondary/50 transition-colors">
          <Avatar
            src={currentUser?.photoURL}
            alt={currentUser?.name}
            fallback={currentUser?.name?.charAt(0)}
            size="sm"
            className="ml-1 shrink-0"
          />
          <div className="flex-1 flex flex-col justify-center">
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              onSubmit={handleSubmit}
              users={allUsers}
              className="border-none bg-transparent py-2 px-2 shadow-none h-auto focus:ring-0 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSubmit(newComment, [])} // Fallback if no mentions were used but they want to submit via click
            disabled={!newComment.trim() || isSubmitting}
            className="w-8 h-8 shrink-0 flex items-center justify-center bg-secondary text-white rounded-xl hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setCommentToDelete(null)} />
          <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-[20px] flex items-center justify-center mb-6 mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>

            <h3 className="text-xl font-black text-white text-center tracking-tight mb-2">Apagar Comentário?</h3>
            <p className="text-sm text-zinc-400 text-center leading-relaxed">
              Você está prestes a excluir este comentário permanentemente.
              Esta ação <span className="text-red-400 font-bold">não pode ser desfeita</span>.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                type="button"
                onClick={() => setCommentToDelete(null)}
                className="rounded-2xl border border-white/5 hover:bg-white/5 text-white font-bold h-12 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteComment}
                className="rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-lg shadow-red-600/20 transition-all"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

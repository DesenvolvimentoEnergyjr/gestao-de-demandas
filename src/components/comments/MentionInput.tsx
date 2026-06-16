import React, { useState, useRef, useEffect } from 'react';
import { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (text: string, mentionedUsers: User[]) => void;
  users: User[];
  placeholder?: string;
  className?: string;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSubmit,
  users,
  placeholder = 'Escreva um comentário... Use @ para mencionar alguém',
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPosition);

    // Check if we are typing a mention
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_ ]*)$/);

    if (match) {
      setMentionStartIndex(cursorPosition - match[1].length - 1);
      setMentionQuery(match[1]);
      setShowDropdown(true);
      setSelectedIndex(0);

      // Estimate position
      if (textareaRef.current) {
        setDropdownPos({ top: textareaRef.current.offsetHeight + 5, left: 0 });
      }
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelectUser = (user: User) => {
    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(textareaRef.current?.selectionStart || 0);
    const newText = `${beforeMention}@${user.name} ${afterMention}`;

    onChange(newText);
    setSelectedUsers((prev) => {
      if (!prev.find(u => u.uid === user.uid)) return [...prev, user];
      return prev;
    });

    setShowDropdown(false);

    // Focus back and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + user.name.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredUsers[selectedIndex]) {
          handleSelectUser(filteredUsers[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (!value.trim()) return;

    // Verify which users are actually in the text
    const actualMentions = selectedUsers.filter(u => value.includes(`@${u.name}`));

    onSubmit(value, actualMentions);
    setSelectedUsers([]);
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "block w-full bg-zinc-950 border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-secondary transition-all resize-none",
          className
        )}
        rows={1}
      />

      <AnimatePresence>
        {showDropdown && filteredUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            {filteredUsers.map((user, index) => (
              <button
                key={user.uid}
                type="button"
                onClick={() => handleSelectUser(user)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  index === selectedIndex ? "bg-secondary/20 border-l-2 border-secondary" : "hover:bg-white/5 border-l-2 border-transparent"
                )}
              >
                <Avatar src={user.photoURL} alt={user.name} size="xs" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">{user.name}</span>
                  <span className="text-[10px] text-zinc-500 uppercase truncate">{user.area || 'Membro'}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

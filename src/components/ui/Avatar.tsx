import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, size = 'md', className }) => {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <div className={cn('relative flex shrink-0 overflow-hidden rounded-full bg-bg-surface border border-border-subtle', sizes[size], className)}>
      {src ? (
        <Image 
          src={src} 
          alt={alt || 'avatar'} 
          fill 
          className="aspect-square h-full w-full object-cover" 
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary-dark text-white font-medium">
          {fallback || alt?.substring(0, 2).toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
};

export { Avatar };

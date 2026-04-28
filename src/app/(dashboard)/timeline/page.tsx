'use client';

import React, { useEffect } from 'react';
import { TimelineView } from '@/components/timeline/TimelineView';
import { getUsers } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { useState } from 'react';
import { User } from '@/types';

export default function TimelinePage() {
  const { demands, loading } = useDemandStore();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getUsers(true).then(setUsers).catch(console.error);
  }, []);

  return (
    <div className="min-h-full w-full flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
        </div>
      ) : (
        <TimelineView demands={demands} users={users} />
      )}
    </div>
  );
}
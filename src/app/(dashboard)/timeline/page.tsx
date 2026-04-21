'use client';

import React, { useEffect } from 'react';
import { TimelineView } from '@/components/timeline/TimelineView';
import { getDemands, getUsers } from '@/lib/firestore';
import { useDemandStore } from '@/store/useDemandStore';
import { useState } from 'react';
import { User } from '@/types';

export default function TimelinePage() {
  const { demands, setDemands, loading, setLoading } = useDemandStore();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [demandsData, usersData] = await Promise.all([
          getDemands(),
          getUsers(true),
        ]);
        setDemands(demandsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Erro ao carregar Timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setDemands, setLoading]);

  return (
    <div className="h-full w-full overflow-hidden">
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
        </div>
      ) : (
        <TimelineView demands={demands} users={users} />
      )}
    </div>
  );
}
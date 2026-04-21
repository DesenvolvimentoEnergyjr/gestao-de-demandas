'use client';

import React, { useEffect, useState } from 'react';
import { TimelineView } from '@/components/timeline/TimelineView';
import { getDemands, getUsers } from '@/lib/firestore';
import { Demand, User } from '@/types';

export default function TimelinePage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [demandsData, usersData] = await Promise.all([
          getDemands(),
          getUsers()
        ]);
        setDemands(demandsData);
        setUsers(usersData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="h-full w-full overflow-hidden">
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
        </div>
      ) : (
        <TimelineView demands={demands} users={users} />
      )}
    </div>
  );
}

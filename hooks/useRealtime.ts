import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useRealtime = (table: string, filter?: string) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    let subscription: any;

    const setupSubscription = async () => {
      let query = supabase.from(table).select('*');

      if (filter) {
        query = query.eq('status', filter);
      }

      // Get initial data
      const { data: initialData } = await query;
      setData(initialData || []);

      // Subscribe to changes
      subscription = supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload) => {
            switch (payload.eventType) {
              case 'INSERT':
                setData(current => [payload.new, ...current]);
                break;
              case 'UPDATE':
                setData(current =>
                  current.map(item =>
                    item.id === payload.new.id ? payload.new : item
                  )
                );
                break;
              case 'DELETE':
                setData(current =>
                  current.filter(item => item.id !== payload.old.id)
                );
                break;
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [table, filter]);

  return { data };
};
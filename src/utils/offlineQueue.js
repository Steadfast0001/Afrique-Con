// Offline Mutation Queue Manager
// Stores failed mutations during network loss and replays them when back online

import { supabase, isSupabaseConfigured } from '../context/supabaseClient';

const QUEUE_KEY = 'transitflow_mutation_queue';

export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function enqueueOfflineMutation(mutation) {
  const queue = getOfflineQueue();
  queue.push({
    ...mutation,
    queuedAt: new Date().toISOString()
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function replayOfflineQueue() {
  if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const remaining = [];

  for (const item of queue) {
    try {
      if (item.type === 'INSERT') {
        const { error } = await supabase.from(item.table).insert(item.payload);
        if (error && !error.message.includes('duplicate key') && !error.message.includes('already exists')) {
          remaining.push(item);
        }
      } else if (item.type === 'UPDATE') {
        const { error } = await supabase.from(item.table).update(item.payload).match(item.match);
        if (error) remaining.push(item);
      } else if (item.type === 'DELETE') {
        const { error } = await supabase.from(item.table).delete().match(item.match);
        if (error) remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

// Automatically listen for browser online events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    replayOfflineQueue();
  });
}

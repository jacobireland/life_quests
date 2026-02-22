import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface Instrument {
  id: number;
  title: string;
}

export function SupabaseInstruments() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInstruments();
  }, []);

  async function getInstruments() {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('Test Table')
        .select();
      if (fetchError) throw fetchError;
      setInstruments(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Test Table');
      setInstruments([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2 className="font-semibold text-foreground-text mb-4">From Supabase</h2>
        <p className="text-foreground-muted text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="font-semibold text-foreground-text mb-4">From Supabase</h2>
        <p className="text-destructive text-sm">{error}</p>
        <p className="text-foreground-subtle text-xs mt-2">
          Ensure the <code className="bg-surface-subtle px-1 rounded">Test Table</code> table exists
          and RLS allows read (see guide step 1–2).
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-foreground-text mb-4">From Supabase</h2>
      <ul className="space-y-1">
        {instruments.map((instrument) => (
          <li key={instrument.id} className="text-foreground-text">
            {instrument.title}
          </li>
        ))}
      </ul>
      {instruments.length === 0 && (
        <p className="text-foreground-subtle text-sm">No rows in Test Table yet.</p>
      )}
    </div>
  );
}

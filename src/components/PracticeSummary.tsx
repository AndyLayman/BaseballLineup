'use client';

import { useState, useCallback } from 'react';
import { Game, PracticeNotes } from '@/lib/types';

interface Props {
  game: Game;
  onClose: () => void;
  onSave: (notes: PracticeNotes) => Promise<void>;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatShareText(game: Game, data: PracticeNotes): string {
  const date = formatFullDate(game.date);
  const lines: string[] = [];
  lines.push('PRACTICE SUMMARY');
  lines.push(`${game.opponent ? `vs ${game.opponent}` : 'Practice'} — ${date}`);
  lines.push('');
  if (data.notes) {
    lines.push('NOTES');
    lines.push(data.notes);
    lines.push('');
  }
  if (data.items_covered.length > 0) {
    lines.push('WHAT WE COVERED');
    data.items_covered.forEach(item => lines.push(`• ${item}`));
    lines.push('');
  }
  if (data.team_notes) {
    lines.push('TEAM NOTES');
    lines.push(data.team_notes);
    lines.push('');
  }
  if (data.action_items.length > 0) {
    lines.push('ACTION ITEMS');
    data.action_items.forEach(item => lines.push(`☐ ${item}`));
    lines.push('');
  }
  return lines.join('\n').trim();
}

export default function PracticeSummary({ game, onClose, onSave }: Props) {
  const initial = game.practice_notes;
  const [mode, setMode] = useState<'edit' | 'paper'>(initial ? 'paper' : 'edit');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [itemsCovered, setItemsCovered] = useState<string[]>(initial?.items_covered || []);
  const [teamNotes, setTeamNotes] = useState(initial?.team_notes || '');
  const [actionItems, setActionItems] = useState<string[]>(initial?.action_items || []);
  const [newItem, setNewItem] = useState('');
  const [newAction, setNewAction] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentData: PracticeNotes = { notes, items_covered: itemsCovered, team_notes: teamNotes, action_items: actionItems };

  const addToList = useCallback((value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed) {
      setList([...list, trimmed]);
      setInput('');
    }
  }, []);

  const removeFromList = useCallback((index: number, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((_, i) => i !== index));
  }, []);

  const handleSaveAndPreview = async () => {
    setSaving(true);
    await onSave(currentData);
    setSaving(false);
    setMode('paper');
  };

  const handleShare = async () => {
    const text = formatShareText(game, currentData);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Practice Summary - ${game.opponent || 'Practice'}`,
          text,
        });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  const hasContent = notes || itemsCovered.length > 0 || teamNotes || actionItems.length > 0;

  // ============ PAPER VIEW ============
  if (mode === 'paper') {
    return (
      <div className="flex-1 flex flex-col min-h-0" style={{ background: '#E8E8E8' }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setMode('edit')}
            className="h-9 px-3 rounded-lg text-xs font-medium touch-manipulation btn-secondary"
          >
            ← Edit
          </button>
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-lg text-xs font-medium touch-manipulation btn-secondary"
          >
            Done
          </button>
          <button
            onClick={handleShare}
            className="h-9 px-4 rounded-lg text-xs font-semibold touch-manipulation btn-primary"
          >
            {copied ? '✓ Copied!' : 'Share'}
          </button>
        </div>

        {/* Paper scroll area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
          <div style={{
            background: '#FFFFFF',
            color: '#1a1a1a',
            width: '100%',
            maxWidth: '640px',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            padding: '40px 32px',
            fontFamily: "'Montserrat', sans-serif",
            alignSelf: 'flex-start',
          }}>
            {/* Logo + Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '24px' }}>
              <svg width="33" height="28" viewBox="0 0 33 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginRight: '16px', marginTop: '2px' }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M6.82602 3.80953C11.9054 -1.26984 20.1407 -1.26984 25.2201 3.80953L31.3444 9.93381C32.28 10.8695 32.2801 12.3865 31.3444 13.3222L17.7173 26.9492C16.7816 27.8849 15.2646 27.8849 14.3289 26.9492L0.701741 13.3222C-0.233923 12.3865 -0.233904 10.8695 0.701741 9.93381L6.82602 3.80953ZM16.9149 3.21411C16.3178 3.15929 15.7168 3.16214 15.1202 3.22257L14.8005 3.255C13.4619 3.3906 12.1692 3.81828 11.0138 4.50791C10.5194 4.80305 10.0537 5.14404 9.62298 5.52628L9.19067 5.91001C8.90516 6.1634 9.03836 6.63444 9.41429 6.70075L14.6669 7.62732C17.3189 8.09514 19.9345 8.75021 22.4939 9.58752L27.7916 11.3205C28.0221 11.3959 28.1955 11.1072 28.0207 10.9391L22.758 5.88093L21.7436 5.103C20.3447 4.03017 18.6705 3.37528 16.9149 3.21411Z" fill="#111111"/>
              </svg>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#000' }}>
                  Practice Summary
                </h1>
                <p style={{ fontSize: '14px', fontWeight: 400, margin: '4px 0 0', color: '#666' }}>
                  {game.opponent ? `vs ${game.opponent}` : 'Practice'} &mdash; {formatFullDate(game.date)}
                </p>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1.5px solid #E0E0E0', margin: '0 0 28px' }} />

            {/* Notes */}
            {notes && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', margin: '0 0 10px' }}>Notes</h2>
                <p style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, margin: 0, color: '#333', whiteSpace: 'pre-wrap' }}>{notes}</p>
              </div>
            )}

            {/* What We Covered */}
            {itemsCovered.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', margin: '0 0 10px' }}>What We Covered</h2>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', fontWeight: 300, lineHeight: 1.9, color: '#333' }}>
                  {itemsCovered.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Team Notes */}
            {teamNotes && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', margin: '0 0 10px' }}>Team Notes</h2>
                <p style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, margin: 0, color: '#333', whiteSpace: 'pre-wrap' }}>{teamNotes}</p>
              </div>
            )}

            {/* Action Items */}
            {actionItems.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', margin: '0 0 10px' }}>Action Items</h2>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '14px', fontWeight: 300, lineHeight: 2, color: '#333' }}>
                  {actionItems.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '1.5px solid #CCC', borderRadius: '3px', flexShrink: 0, marginTop: '5px' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty state */}
            {!hasContent && (
              <p style={{ fontSize: '14px', fontWeight: 300, color: '#999', textAlign: 'center', padding: '40px 0' }}>
                No content yet — tap Edit to add notes.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============ EDIT VIEW ============
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--clay)' }}>Practice Summary</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-lg text-lg flex items-center justify-center touch-manipulation btn-secondary"
        >
          &times;
        </button>
      </div>

      {/* Notes */}
      <div className="mb-5">
        <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How did practice go?"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
          style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', fontFamily: 'inherit', fontWeight: 300 }}
        />
      </div>

      {/* What We Covered */}
      <div className="mb-5">
        <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>What We Covered</label>
        {itemsCovered.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {itemsCovered.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                {item}
                <button
                  onClick={() => removeFromList(i, itemsCovered, setItemsCovered)}
                  className="opacity-50 hover:opacity-100 text-sm leading-none"
                  style={{ color: 'var(--danger)' }}
                >&times;</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList(newItem, itemsCovered, setItemsCovered, setNewItem); } }}
            placeholder="e.g. Batting drills, fielding..."
            className="flex-1 h-9 px-3 rounded-lg text-xs outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <button
            onClick={() => addToList(newItem, itemsCovered, setItemsCovered, setNewItem)}
            className="h-9 px-3 rounded-lg text-xs font-medium touch-manipulation btn-secondary"
          >
            Add
          </button>
        </div>
      </div>

      {/* Team Notes */}
      <div className="mb-5">
        <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Team Notes</label>
        <textarea
          value={teamNotes}
          onChange={e => setTeamNotes(e.target.value)}
          placeholder="Notes for the team or parents..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
          style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', fontFamily: 'inherit', fontWeight: 300 }}
        />
      </div>

      {/* Action Items */}
      <div className="mb-6">
        <label className="block text-[11px] font-bold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Action Items</label>
        {actionItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {actionItems.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                {item}
                <button
                  onClick={() => removeFromList(i, actionItems, setActionItems)}
                  className="opacity-50 hover:opacity-100 text-sm leading-none"
                  style={{ color: 'var(--danger)' }}
                >&times;</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={newAction}
            onChange={e => setNewAction(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList(newAction, actionItems, setActionItems, setNewAction); } }}
            placeholder="e.g. Work on bunting at home..."
            className="flex-1 h-9 px-3 rounded-lg text-xs outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <button
            onClick={() => addToList(newAction, actionItems, setActionItems, setNewAction)}
            className="h-9 px-3 rounded-lg text-xs font-medium touch-manipulation btn-secondary"
          >
            Add
          </button>
        </div>
      </div>

      {/* Preview & Share button */}
      <button
        onClick={handleSaveAndPreview}
        disabled={saving}
        className="w-full h-11 rounded-lg text-sm font-semibold touch-manipulation btn-primary"
      >
        {saving ? 'Saving...' : 'Preview & Share'}
      </button>
    </div>
  );
}

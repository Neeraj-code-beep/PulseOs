import { BellRing, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const NotificationPermissionDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-2xl flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <BellRing size={20} />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Enable Reminders?
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          PulseOS can alert you with browser notifications when your task reminders become due.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-soft)]">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Not now
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            Allow notifications
          </Button>
        </div>
      </div>
    </div>
  );
};

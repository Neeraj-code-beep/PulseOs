import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { BellRing, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const NotificationPermissionDialog = ({ isOpen, onConfirm, onCancel }) => {
  const shouldReduceMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  // Manage focus entry, containment, and restoration
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement;

    // Focus initial element inside dialog
    const focusTimer = setTimeout(() => {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        // Focus the primary allow button (last button)
        const allowButton = focusableElements[focusableElements.length - 1];
        allowButton?.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === 'function'
      ) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onCancel}
      role="presentation"
    >
      <Motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-dialog-title"
        aria-describedby="notification-dialog-description"
        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-2xl flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <BellRing size={20} />
            <h3
              id="notification-dialog-title"
              className="text-sm font-bold text-[var(--text-primary)] font-sans"
            >
              Enable Reminders?
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close notification permission dialog"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p
          id="notification-dialog-description"
          className="text-xs text-[var(--text-secondary)] leading-relaxed"
        >
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
      </Motion.div>
    </div>
  );
};

NotificationPermissionDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default NotificationPermissionDialog;

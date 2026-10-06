import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

export const DropdownMenu = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  className = '',
  align = 'end',
}) => {
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUpward: false });

  const updatePosition = useCallback(() => {
    if (!triggerRef?.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuHeight = menuEl ? menuEl.offsetHeight : 130;
    const menuWidth = menuEl ? menuEl.offsetWidth : 130;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + 10 && spaceAbove > spaceBelow;

    let top = openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4;
    let left = align === 'end' ? rect.right - menuWidth : rect.left;

    // Viewport collision clamping
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (top < 8) {
      top = 8;
    }

    setCoords({ top, left, openUpward });
  }, [triggerRef, align]);

  useEffect(() => {
    if (!isOpen) return;

    // Initial position update and requestAnimationFrame tick to measure mounted DOM element
    updatePosition();
    const frameId = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Click outside & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: coords.openUpward ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: coords.openUpward ? 4 : -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9999,
          }}
          className={`min-w-[130px] bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-xl py-1 flex flex-col focus:outline-none ${className}`}
          role="menu"
        >
          {children}
        </Motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

DropdownMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  triggerRef: PropTypes.shape({ current: PropTypes.any }),
  children: PropTypes.node,
  className: PropTypes.string,
  align: PropTypes.oneOf(['start', 'end']),
};

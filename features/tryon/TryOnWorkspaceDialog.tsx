import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  id: string;
  children: React.ReactNode;
}

export default function TryOnWorkspaceDialog({ open, onClose, title, id, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="tryon-workspace-dialog"
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="tryon-dialog-heading">
        <h2 id={`${id}-title`}>{title}</h2>
        <button
          type="button"
          className="tool-button tool-button-secondary"
          onClick={onClose}
          aria-label={language === 'zh-TW' ? '關閉' : 'Close'}
        >
          {language === 'zh-TW' ? '關閉' : 'Close'}
        </button>
      </header>
      <div className="tryon-dialog-content">{children}</div>
    </dialog>
  );
}

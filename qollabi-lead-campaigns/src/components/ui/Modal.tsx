"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl p-6 w-[480px] max-w-[90vw] max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-base font-semibold mb-4">{title}</h3>
        {children}
        {footer && (
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

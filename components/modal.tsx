"use client";

import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function Modal({
  isOpen,
  title,
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
  onClose,
  onConfirm,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>

          {description && (
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          )}
        </div>

        {children && <div className="mb-6">{children}</div>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>

          {onConfirm && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

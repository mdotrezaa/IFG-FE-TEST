"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissToast } from "@/store/toast-slice";
import type { ToastMessage } from "@/store/toast-slice";

export default function ToastViewport() {
  const toasts = useAppSelector((state) => state.toast.items);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-100 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => dispatch(dismissToast(toast.id)),
      toast.kind === "error" ? 7000 : 4500,
    );

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, toast.id, toast.kind]);

  const styles = {
    success: "border-l-4 border-l-emerald-500",
    error: "border-l-4 border-l-red-500",
    info: "border-l-4 border-l-blue-500",
  }[toast.kind];

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex items-start gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3.5 shadow-xl shadow-gray-900/5 ${styles}`}
    >
      <p className="min-w-0 flex-1 text-sm leading-5 text-gray-700">
        {toast.message}
      </p>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="-mr-1 -mt-1 shrink-0 rounded-md px-1.5 py-0.5 text-lg leading-5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      >
        ×
      </button>
    </div>
  );
}

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ToastKind = "success" | "error" | "info";

export type ToastMessage = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastState = {
  items: ToastMessage[];
};

let nextToastId = 0;

const toastSlice = createSlice({
  name: "toast",
  initialState: { items: [] } as ToastState,
  reducers: {
    showToast: {
      reducer(state, action: PayloadAction<ToastMessage>) {
        state.items.push(action.payload);
      },
      prepare(toast: Omit<ToastMessage, "id">) {
        nextToastId += 1;
        return { payload: { ...toast, id: nextToastId } };
      },
    },
    dismissToast(state, action: PayloadAction<number>) {
      state.items = state.items.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { showToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;

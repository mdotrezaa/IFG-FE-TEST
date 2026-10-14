import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "@/store/ui-slice";
import draftReducer from "@/store/draft-slice";

export const makeStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
      draft: draftReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import templateReducer from "./slices/templateSlice";
import visitReducer from "./slices/visitSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import sessionReducer from "./slices/sessionSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "session"],
};

const rootReducer = combineReducers({
  session: sessionReducer,
  user: userReducer,
  template: templateReducer,
  visit: visitReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types";

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state: UserState, action: PayloadAction<User>) => {
      const updatedUser = action.payload;
      if (state.user) {
        state.user = { ...state.user, ...updatedUser };
      } else {
        state.user = updatedUser;
      }
    },
    clearUser: (state: UserState) => {
      state.user = null;
    },
    setLoading: (state: UserState, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state: UserState, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading, setError } = userSlice.actions;
export default userSlice.reducer;

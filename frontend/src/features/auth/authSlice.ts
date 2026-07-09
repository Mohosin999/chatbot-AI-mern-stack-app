import api from "@/api/axiosInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AuthState } from "@/types";

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `${import.meta.env.VITE_BASE_URL}/auth/register`,
        userData
      );

      localStorage.setItem("accessToken", res.data.data.access_token);
      localStorage.setItem("refreshToken", res.data.data.refresh_token);

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Register failed"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `${import.meta.env.VITE_BASE_URL}/auth/login`,
        userData
      );

      localStorage.setItem("accessToken", res.data.data.access_token);
      localStorage.setItem("refreshToken", res.data.data.refresh_token);

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token found");

      const res = await api.post(
        `${import.meta.env.VITE_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      );

      if (res.data.logout) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        const { persistor } = await import("@/store/store");
        dispatch(authSlice.actions.resetAuth());
        await persistor.flush();
        await persistor.purge();

        window.location.reload();
      }

      localStorage.setItem("accessToken", res.data.data.access_token);

      if (res.data.data.refresh_token) {
        localStorage.setItem("refreshToken", res.data.data.refresh_token);
      }

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Token refresh failed"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return rejectWithValue("No authentication token found");

      await api.post(
        `${import.meta.env.VITE_BASE_URL}/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

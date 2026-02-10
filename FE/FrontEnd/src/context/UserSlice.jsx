import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const parsedUser = storedUser ? JSON.parse(storedUser) : null;

const initialState = {
  token: localStorage.getItem("token") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  user: parsedUser,
  role: parsedUser?.role || localStorage.getItem("role") || null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { token, refreshToken, user, role } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken || null;
      state.user = user;
      state.role = role || user?.role || null;
      localStorage.setItem("token", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      if (role || user?.role) localStorage.setItem("role", role || user?.role);
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.role = null;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export const { loginSuccess, logout, updateUser } = userSlice.actions;
export default userSlice.reducer;

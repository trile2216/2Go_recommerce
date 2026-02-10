import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, logout as logoutAction, updateUser } from "./UserSlice";
import { logout as logoutAPI } from "../service/auth/api.auth";
import { getUserInfo } from "../service/home/api.user";
import api from "../config/axios";
import { useNavigate } from "react-router-dom";

const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user.user);
  const token = useSelector((state) => state.user.token);
  const role = useSelector((state) => state.user.role);
  const isLoggedIn = !!token;

  const login = async (credentials) => {
    const response = await api.post("/Auth/login", credentials);
    const { accessToken, refreshToken, userId, email, phone, role } = response.data;

    const userData = {
      userId,
      email,
      phone,
      role,
      fullName: email?.split("@")[0],
    };

    dispatch(loginSuccess({ token: accessToken, refreshToken, user: userData, role }));

    // Fetch full user profile and update store
    try {
      const fullProfile = await getUserInfo();
      dispatch(updateUser(fullProfile));
    } catch (err) {
      console.error("Failed to fetch user profile after login:", err);
    }

    switch (role) {
        case "Admin":
          navigate("/admin");
          break;
        case "Moderator":
          navigate("/admin");
          break;
        case "User":
          navigate("/");
          break;
        default:
          navigate("/");
      }

    return { user: userData, token: accessToken };
  };

  const loginWithOAuthAction = async (oauthData) => {
    const response = await api.post("/Auth/firebase-login", oauthData);
    const { accessToken, refreshToken, userId, email, phone, role } = response.data;

    const userData = {
      userId,
      email: email || oauthData.email,
      phone,
      role,
      fullName: oauthData.displayName || email?.split("@")[0],
    };

    dispatch(loginSuccess({ token: accessToken, refreshToken, user: userData, role }));

    // Fetch full user profile and update store
    try {
      const fullProfile = await getUserInfo();
      dispatch(updateUser(fullProfile));
    } catch (err) {
      console.error("Failed to fetch user profile after OAuth login:", err);
    }

    switch (role) {
        case "Admin":
          navigate("/admin");
          break;
        case "Moderator":
          navigate("/admin");
          break;
        case "User":
          navigate("/");
          break;
        default:
          navigate("/");
      }

    return { user: userData, token: accessToken };
  };

  const logoutUser = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await logoutAPI(refreshToken);
      }
    } catch (error) {
      console.error("Error during logout API call:", error);
    } finally {
      dispatch(logoutAction());
    }
  };

  return { user, token, role, isLoggedIn, login, loginWithOAuthAction, logoutUser };
};

export default useAuth;

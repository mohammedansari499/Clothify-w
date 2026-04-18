import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/auth/profile");
          setUser(res.data);
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("user_id");
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    if (res.data.user_id) {
      localStorage.setItem("user_id", res.data.user_id);
    }
    // Set user from response payload
    setUser(res.data.user || { email });
    return res.data;
  };

  const register = async (userData) => {
    // userData contains { email, password, name, username, etc }
    const res = await api.post("/auth/register", userData);
    
    // Auto-login if token is returned
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      if (res.data.user_id) {
        localStorage.setItem("user_id", res.data.user_id);
      }
      setUser(res.data.user);
    }
    
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    setUser(null);
  };

  const googleLogin = async (token) => {
    const res = await api.post("/auth/google", { token });
    localStorage.setItem("token", res.data.token);
    if (res.data.user_id) {
      localStorage.setItem("user_id", res.data.user_id);
    }
    try {
      const profileRes = await api.get("/auth/profile");
      setUser(profileRes.data);
    } catch {
      setUser({ email: "google-user@example.com" });
    }
    return res.data;
  };

  const updateProfile = async (userData) => {
    const res = await api.put("/auth/profile", userData);
    setUser(res.data.user);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, setUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

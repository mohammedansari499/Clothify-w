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
        } catch (error) {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser({ email });
    return res.data;
  };

  const register = async (email, password) => {
    await api.post("/auth/register", { email, password });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const googleLogin = async (token) => {
    const res = await api.post("/auth/google", { token });
    localStorage.setItem("token", res.data.token);
    try {
      const profileRes = await api.get("/auth/profile");
      setUser(profileRes.data);
    } catch (err) {
      setUser({ email: "google-user@example.com" });
    }
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

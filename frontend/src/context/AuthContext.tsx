import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { CONFIG, LOCAL_STORAGE } from '../constants';



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = CONFIG.API_URL;

  useEffect(() => {
    const savedToken = localStorage.getItem(LOCAL_STORAGE.TOKEN);
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await axios.get(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem(LOCAL_STORAGE.TOKEN);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem(LOCAL_STORAGE.TOKEN, token);
      setToken(token);
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE.TOKEN);
    setToken(null);
    setUser(null);
  };

  return (
    (<AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>)
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth needs AuthProvider');
  return context;
};

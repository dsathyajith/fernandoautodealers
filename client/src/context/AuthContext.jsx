import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { loginWithEmail, logout as firebaseLogout } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  const login = (email, password) => loginWithEmail(email, password);
  const logout = () => firebaseLogout();

  if (user === undefined) return null; // wait for Firebase to resolve auth state

  const username = user?.displayName || user?.email?.split('@')[0] || 'Admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, username }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginPayload, RegisterPayload } from '../types/auth';
import { authService, authSimulado } from '../services/auth';
import { api, estadoServidor, setUnauthorizedHandler } from '../services/api';

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Una petición lleva > 4 s esperando a un servidor que estaba dormido
   * (arranque en frío de Render, hasta ~60 s). Las pantallas pueden mostrar
   * `MENSAJE_DESPERTANDO` de `services/api` mientras sea `true`.
   */
  servidorDespertando: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [servidorDespertando, setServidorDespertando] = useState<boolean>(
    estadoServidor.despertando()
  );

  // Despierta el backend en cuanto abre la app (mientras la persona escribe) y
  // escucha si alguna petición se queda esperando al arranque en frío.
  useEffect(() => {
    api.despertarServidor();
    return estadoServidor.suscribir(setServidorDespertando);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await authService.getStoredSession();
        if (session.token && session.user) {
          // Se entra con la sesión guardada sin esperar a la red (funciona
          // offline) y se valida en segundo plano: si el token caducó y no se
          // puede renovar, el 401 de `/auth/me` cierra la sesión (handler de abajo).
          setToken(session.token);
          setUser(session.user);
          authService.validarSesion().then((actual) => {
            if (actual) setUser((previo) => (previo ? actual : previo));
          });
        }
      } catch (e) {
        console.error('Error initializing auth context:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // Si Supabase rechaza el token (vencido o revocado), se limpia la sesión
  // local para que el usuario vuelva al login en vez de quedar en un limbo.
  // En modo simulado el backend siempre rechaza el token falso: no se cierra
  // la sesión, cada pantalla muestra su propio error de carga.
  useEffect(() => {
    if (authSimulado) return;
    setUnauthorizedHandler(() => {
      authService.logout();
      setUser(null);
      setToken(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (payload: LoginPayload) => {
    // Sin `isLoading` aquí: activarlo hace que RootNavigator muestre el Splash,
    // desmonte el formulario y el error de la API no llegue a verse. Cada
    // pantalla lleva su propio estado de carga.
    const res = await authService.login(payload);
    setUser(res.user);
    setToken(res.token);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    setUser(res.user);
    setToken(res.token);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        servidorDespertando,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

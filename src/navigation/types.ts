import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { HamiltonResult } from '../types/chat';

/** Pestañas de la barra inferior (diseño: Inicio · Registro · Recursos · Perfil). */
export type TabParamList = {
  InicioTab: undefined;
  RegistroTab: undefined;
  RecursosTab: undefined;
  PerfilTab: undefined;
};

/**
 * Pila raíz. Sin sesión: Bienvenida → Login / Register.
 * Con sesión: MainApp (pestañas) y, encima y sin tab bar, Chat, Voz,
 * Actividades, Result y CrisisProtocol.
 */
export type RootStackParamList = {
  Bienvenida: undefined;
  Login: undefined;
  Register: undefined;
  MainApp: NavigatorScreenParams<TabParamList> | undefined;
  /** `enfocar`: abre con el campo de texto enfocado (teclado arriba), p. ej. desde Voz. */
  Chat: { enfocar?: boolean } | undefined;
  Voz: undefined;
  Actividades: undefined;
  Result: { resultado: HamiltonResult };
  CrisisProtocol: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  // Permite `useNavigation()` tipado sin genéricos en toda la app.
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

module.exports = function (api) {
  api.cache(true);

  return {
    // Sin NativeWind: la app no usa `className` y su capa de interoperabilidad
    // rompía los `style={({ pressed }) => …}` de Pressable en iOS/Android
    // (botones sin fondo). Estilos con objetos y tokens de `src/constants`.
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};

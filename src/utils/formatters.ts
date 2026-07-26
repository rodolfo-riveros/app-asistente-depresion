import { colors } from '../constants/colors';

export const formatters = {
  formatTime(dateStringOrObject: string | Date): string {
    const d =
      typeof dateStringOrObject === 'string' ? new Date(dateStringOrObject) : dateStringOrObject;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  formatDate(dateStringOrObject: string | Date): string {
    const d =
      typeof dateStringOrObject === 'string' ? new Date(dateStringOrObject) : dateStringOrObject;
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Escala de severidad: teal -> azul acero -> ámbar -> rojo.
  // Todos cumplen >= 4.5:1 sobre `colors.background` (#EDF4F3).
  getSeverityColor(nivel?: string): string {
    switch (nivel) {
      case 'Sin depresión':
        return colors.primary; // teal calma
      case 'Depresión leve':
        return colors.accent; // azul acero
      case 'Depresión moderada':
        return colors.warning; // ámbar
      case 'Depresión severa':
        return colors.danger; // rojo sobrio
      default:
        return colors.accent;
    }
  },
};

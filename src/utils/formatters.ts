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

  getSeverityColor(nivel?: string): string {
    switch (nivel) {
      case 'Sin depresión':
        return '#4ae176'; // Spatial Secondary Green
      case 'Depresión leve':
        return '#98cbff'; // Spatial Primary Luminous Blue
      case 'Depresión moderada':
        return '#8f92ff'; // Spatial Tertiary Violet
      case 'Depresión severa':
        return '#ffb4ab'; // Spatial Crisis Error Coral
      default:
        return '#98cbff';
    }
  },
};

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
};

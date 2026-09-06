/**
 * Convierte una URL de blob/objeto a data URI para que el HTML exportado
 * quede autocontenido. Si falla, devuelve la URL original.
 */
export const blobToBase64 = async (url: string): Promise<string> => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
};

/**
 * Escapa texto del usuario antes de interpolarlo en el documento. Sin esto,
 * un & o un < en el mensaje rompe el render de la carta.
 */
export const escapeHtml = (value: string): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Remove caracteres especiais e sanitiza strings para uso em paths do Storage
 */
export const sanitizePath = (path: string): string => {
  return path
    .normalize('NFD') // Normaliza para decompor acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Substitui caracteres especiais por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens no início/fim
};

/**
 * Sanitiza CNPJ para uso como nome de pasta
 * Exemplo: "12.345.678/0001-90" -> "12345678000190"
 */
export const sanitizeCnpj = (cnpj: string): string => {
  return cnpj.replace(/[^\d]/g, ''); // Remove tudo exceto números
};

/**
 * Sanitiza nome de arquivo mantendo a extensão
 * Exemplo: "Captura de Tela 2025.png" -> "Captura-de-Tela-2025.png"
 */
export const sanitizeFileName = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    // Sem extensão
    return sanitizePath(fileName);
  }
  
  const name = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex + 1);
  
  return `${sanitizePath(name)}.${extension.toLowerCase()}`;
};

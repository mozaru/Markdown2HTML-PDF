// src/utils/file.js
// Helpers para ler arquivos locais (File API) e baixar conteúdo via Blob.

/**
 * Lê um arquivo de texto (File) e retorna Promise<string> com o conteúdo.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsText(file, 'utf-8');
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Dispara um download no navegador usando um Blob.
 * @param {string} filename
 * @param {string|Blob} content
 * @param {string} [mime='application/octet-stream']
 */
export function download(filename, content, mime = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = String(filename || 'download');
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

export default { readTextFile, download };

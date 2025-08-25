function getTauriOpener() {
  const g = window.__TAURI__;
  if (!g) return undefined;
  if (g.opener && typeof g.opener.openUrl === 'function') return g.opener.openUrl; // plugin-opener (v2)
  if (g.shell  && typeof g.shell.open  === 'function') return g.shell.open;  // plugin-shell (v1/v2)
  return undefined;
}

export async function openLinkSmart(href) {
    try {
      const open = getTauriOpener()
      if (open) await open(href);
      return;
    } catch (e) {
      console.log(e);
    }
}

export function applyLinkSmart()
{
  const isTauri = typeof window !== 'undefined' && ('__TAURI__' in window);
  if (isTauri)
  {
    //const ignoreList = ['index.html', 'simple.html', 'advance.html'];

    document.querySelectorAll('a[href]').forEach((element) => {
      const href = element.getAttribute('href');
      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        url = null
      }
      const isDownload  = element.hasAttribute('download');
      const isExternal = url && (url.origin !== window.location.origin);
      const hasTarget = element.hasAttribute('target'); // qualquer target
      
      // ignora âncoras internas (#...) e os arquivos da lista
      if (!isDownload && (isExternal || hasTarget))
      {
        element.addEventListener('click', async (e) => {
          e.preventDefault();
          await openLinkSmart(url.href);
        });
      }
    });
  }
}

export default { openLinkSmart, applyLinkSmart };
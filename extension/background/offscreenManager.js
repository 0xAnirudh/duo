const OFFSCREEN_PATH = 'offscreen/offscreen.html';

let creating = null;

async function exists() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });
  return contexts.length > 0;
}

export async function ensureOffscreen() {
  if (await exists()) return;
  if (creating) return creating;

  creating = chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: [chrome.offscreen.Reason.WEB_RTC],
    justification: 'Holds the persistent connection to the paired device.',
  });

  try {
    await creating;
  } catch (err) {
    if (!(await exists())) throw err;
  } finally {
    creating = null;
  }
}

export async function closeOffscreen() {
  if (await exists()) await chrome.offscreen.closeDocument();
}

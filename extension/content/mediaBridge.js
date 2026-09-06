import { CH } from '../shared/protocol.js';

chrome.runtime.onMessage.addListener((message) => {
  if (message?.channel !== CH.TO_CONTENT) return undefined;
  return undefined;
});

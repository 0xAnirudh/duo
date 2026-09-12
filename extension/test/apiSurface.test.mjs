import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function apisUsedIn(dir) {
  const found = new Set();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.js') && !name.endsWith('.jsx')) continue;
    const src = readFileSync(join(dir, name), 'utf8');
    for (const match of src.matchAll(/chrome\.([a-zA-Z]+)\./g)) {
      found.add(match[1]);
    }
  }
  return found;
}

test('the offscreen document only touches chrome.runtime', () => {
  assert.deepEqual([...apisUsedIn('offscreen')].sort(), ['runtime']);
});

test('the content script only touches chrome.runtime', () => {
  assert.deepEqual([...apisUsedIn('content')].sort(), ['runtime']);
});

test('the popup only touches chrome.runtime', () => {
  assert.deepEqual([...apisUsedIn('popup')].sort(), ['runtime']);
});

test('tabs, storage and alarms stay in the service worker', () => {
  const background = apisUsedIn('background');
  for (const api of ['tabs', 'storage', 'alarms', 'offscreen']) {
    assert.ok(background.has(api), `expected chrome.${api} in background/`);
  }
});

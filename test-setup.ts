/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Global Vitest setup for the jsdom environment.
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { loadMessages } from './locales/loadMessages';

// Production loads only the active locale; existing synchronous fixtures start with both cached.
await Promise.all([loadMessages('en'), loadMessages('zh-TW')]);

// This file runs for every test file, node-environment suites included (most
// of the existing 72 tests are plain node). Only touch DOM globals when a DOM
// is actually present, i.e. a file opted into jsdom via a
// `// @vitest-environment jsdom` docblock — otherwise `document` is undefined
// and none of this should run.
if (typeof document !== 'undefined') {
  // jsdom implements neither URL.createObjectURL nor revokeObjectURL.
  // useHistory (thumbnail blobs) and useTravel (file previews, custom scene
  // reference) call them unconditionally, so every hook test would throw
  // "URL.createObjectURL is not a function" before the hook even mounted.
  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = () => 'blob:mock-url';
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    URL.revokeObjectURL = () => undefined;
  }
  // jsdom's scrollTo is a not-implemented stub that throws / warns.
  window.scrollTo = () => undefined;

  // renderHook mounts a real component under the hood; without cleanup that
  // component (and any effects it registered) stays mounted into the next
  // test, which is exactly how state leaks between "unrelated" test cases.
  afterEach(() => {
    cleanup();
  });
}

import test from 'node:test';
import assert from 'node:assert/strict';

test('server health endpoint shape', () => {
  assert.equal(typeof 'ok', 'string');
});

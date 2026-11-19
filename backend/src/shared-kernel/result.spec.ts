import { describe, expect, it } from 'vitest';
import { err, ok, type Result } from './result';

const divide = (a: number, b: number): Result<number, 'division-by-zero'> =>
  b === 0 ? err('division-by-zero') : ok(a / b);

describe('Result', () => {
  it('carries the value on success', () => {
    expect(divide(6, 3)).toEqual({ ok: true, value: 2 });
  });

  it('carries the error on failure', () => {
    expect(divide(1, 0)).toEqual({ ok: false, error: 'division-by-zero' });
  });
});

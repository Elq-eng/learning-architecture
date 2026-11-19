import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { cruise, type IConfiguration, type IViolation } from 'dependency-cruiser';
import extractTSConfig from 'dependency-cruiser/config-utl/extract-ts-config';
import { describe, expect, it } from 'vitest';

const configuration = createRequire(resolve('package.json'))('./.dependency-cruiser.cjs') as IConfiguration;

const violationsIn = async (path: string): Promise<IViolation[]> => {
  const { tsConfig, ...options } = configuration.options ?? {};
  const result = await cruise(
    [path],
    { ...options, validate: true, ruleSet: { forbidden: configuration.forbidden ?? [] } },
    undefined,
    { tsConfig: extractTSConfig(tsConfig?.fileName ?? 'tsconfig.json') },
  );
  if (typeof result.output === 'string') throw new Error('Unexpected string output');
  return result.output.summary.violations;
};

const FIXTURE = 'tests/architecture/fixtures/violating/src';

describe('dependency rule (TS-1)', () => {
  it('src respects every architecture rule', async () => {
    expect(await violationsIn('src')).toEqual([]);
  });

  it.each([
    ['domain-imports-only-own-domain', 'content/domain/lesson.ts', '../adapters/lesson-repository'],
    ['domain-imports-only-own-domain', 'content/domain/lesson.ts', '../../learning/domain/progress'],
    ['application-imports-only-inner-layers', 'content/application/publish-lesson.ts', '../../infrastructure/config'],
    ['core-has-no-external-dependencies', 'content/domain/lesson.ts', '@nestjs/common'],
    ['core-has-no-external-dependencies', 'content/application/publish-lesson.ts', 'fs'],
    ['contexts-use-only-public-entry-points', 'learning/adapters/lesson-client.ts', '../../content/domain/lesson'],
    ['shared-kernel-is-independent', 'shared-kernel/id.ts', '../content/index'],
    ['infrastructure-is-outermost', 'content/application/publish-lesson.ts', '../../infrastructure/config'],
  ])('fails with %s when %s imports %s', async (rule, from, specifier) => {
    const violations = await violationsIn(FIXTURE);

    expect(violations).toContainEqual(
      expect.objectContaining({
        rule: expect.objectContaining({ name: rule }),
        from: `${FIXTURE}/${from}`,
        unresolvedTo: specifier,
      }),
    );
  });
});

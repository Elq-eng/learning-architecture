// Architecture rules enforced in CI (AGENTS.md §3, ADR-0002 and ADR-0003).
// Paths start with (?:^|/)src/ so the same rules apply to the test fixtures.

const SRC = '(?:^|/)src/';
const EXTERNAL = ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled', 'npm-no-pkg', 'npm-unknown', 'core'];

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-imports-only-own-domain',
      comment: 'The domain layer depends only on its own domain and the shared kernel.',
      severity: 'error',
      from: { path: `${SRC}([^/]+)/domain/` },
      to: {
        path: SRC,
        pathNot: [`${SRC}$1/domain/`, `${SRC}shared-kernel/`],
      },
    },
    {
      name: 'application-imports-only-inner-layers',
      comment: 'The application layer depends only on its own domain, its own application layer and the shared kernel.',
      severity: 'error',
      from: { path: `${SRC}([^/]+)/application/` },
      to: {
        path: SRC,
        pathNot: [`${SRC}$1/(domain|application)/`, `${SRC}shared-kernel/`],
      },
    },
    {
      name: 'core-has-no-external-dependencies',
      comment: 'Domain, application and shared kernel are plain TypeScript: no frameworks, no Node I/O.',
      severity: 'error',
      from: { path: `${SRC}(?:[^/]+/(domain|application)|shared-kernel)/` },
      to: { dependencyTypes: EXTERNAL },
    },
    {
      name: 'contexts-use-only-public-entry-points',
      comment: 'A bounded context only reaches another context through its index.ts.',
      severity: 'error',
      from: { path: `${SRC}([^/]+)/`, pathNot: `${SRC}shared-kernel/` },
      to: {
        path: SRC,
        pathNot: [`${SRC}$1/`, `${SRC}[^/]+/index\\.ts$`, `${SRC}shared-kernel/`],
      },
    },
    {
      name: 'shared-kernel-is-independent',
      comment: 'The shared kernel does not depend on any context or on infrastructure.',
      severity: 'error',
      from: { path: `${SRC}shared-kernel/` },
      to: { path: SRC, pathNot: `${SRC}shared-kernel/` },
    },
    {
      name: 'infrastructure-is-outermost',
      comment: 'Only infrastructure may import infrastructure.',
      severity: 'error',
      from: { path: SRC, pathNot: `${SRC}infrastructure/` },
      to: { path: `${SRC}infrastructure/` },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.spec\\.ts$' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.js', '.json'],
    },
  },
};

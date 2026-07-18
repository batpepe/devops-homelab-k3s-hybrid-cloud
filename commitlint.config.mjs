export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // gitops: the CI manifest-bump commits; learning: mentor log scope.
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'chore', 'ci', 'refactor', 'test', 'perf', 'build', 'style', 'revert', 'gitops'],
    ],
    // Dependabot bodies/footers carry long dependency metadata and release
    // links that cannot be wrapped; header-max-length still applies.
    'body-max-line-length': [0, 'always'],
    'footer-max-line-length': [0, 'always'],
  },
};

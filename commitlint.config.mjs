export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // gitops: the CI manifest-bump commits; learning: mentor log scope.
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'chore', 'ci', 'refactor', 'test', 'perf', 'build', 'style', 'revert', 'gitops'],
    ],
  },
};

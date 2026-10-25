// Conventional Commits, tiêu đề ≤ 72 ký tự (12-onboarding-guide §5.2).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'subject-case': [0],
  },
};

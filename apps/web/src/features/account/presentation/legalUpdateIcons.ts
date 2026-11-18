export const legalUpdateIcons = {
  badge: {
    filled: true,
    symbol: 'verified_user',
    path: 'M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z',
  },
  clock: {
    filled: true,
    symbol: 'shield',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z',
  },
  external: {
    filled: false,
    symbol: 'north_east',
    path: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
  },
  logout: {
    filled: false,
    symbol: 'logout',
    path: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  },
  document: { filled: false, symbol: 'description', path: '' },
  privacy: { filled: false, symbol: 'verified_user', path: '' },
  arrow: { filled: false, symbol: 'arrow_forward', path: 'M3 12h18m-7-7 7 7-7 7' },
} as const;

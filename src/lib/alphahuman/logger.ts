const LOG_BACKGROUND = '#111111DD';
const LOG_PREFIX_COLOR = '#9B59B6';
const LOG_SUFFIX = {
  CONNECTING: '#E4D00A',
  CONNECTED: '#26D907',
  DISCONNECTED: '#9C9C9C',
  'CONNECTION ERROR': '#D1191C',
  'AUTH ERROR': '#D1191C',
  'BACKEND ERROR': '#D1191C',
  'STREAM ERROR': '#D1191C',
  STATE: '#49DBF5',
  REQUEST: '#6887F7',
  RESPONSE: '#0DD151',
  UPDATE: '#F549DB',
  WARN: '#FFA500',
};

export function log(suffix: keyof typeof LOG_SUFFIX, ...data: any) {
  /* eslint-disable @stylistic/max-len */
  /* eslint-disable no-console */
  const func = suffix === 'CONNECTION ERROR' || suffix === 'AUTH ERROR' || suffix === 'BACKEND ERROR' || suffix === 'STREAM ERROR'
    ? console.error
    : suffix === 'WARN' ? console.warn : console.log;
  /* eslint-enable no-console */
  func(
    `%cAiSocket%c${suffix}`,
    `color: ${LOG_PREFIX_COLOR}; background: ${LOG_BACKGROUND}; padding: 0.25rem; border-radius: 0.25rem;`,
    `color: ${LOG_SUFFIX[suffix]}; background: ${LOG_BACKGROUND}; padding: 0.25rem; border-radius: 0.25rem; margin-left: 0.25rem;`,
    ...data,
  );
  /* eslint-enable @stylistic/max-len */
}

import { COLORS } from './colors';

export function getFundingVisual(amount: string) {
  if (/fully funded|full tuition|full scholarship|full cost/i.test(amount)) {
    return { label: 'Fully funded', background: COLORS.accentOliveLight, foreground: COLORS.accentOlive };
  }
  if (/partial|tuition support|up to|maximum|award of/i.test(amount)) {
    return { label: 'Funding available', background: COLORS.accentBlueLight, foreground: COLORS.accentBlue };
  }
  return { label: 'Scholarship award', background: COLORS.accentAmberLight, foreground: COLORS.accentAmber };
}

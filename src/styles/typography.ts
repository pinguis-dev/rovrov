import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '200',
  } as TextStyle,
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '300',
  } as TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,
  footnote: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300',
  } as TextStyle,
} as const;

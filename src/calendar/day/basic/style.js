import { StyleSheet, Platform } from 'react-native';
import * as defaultStyle from '../../../style';

const STYLESHEET_ID = 'stylesheet.day.basic';

export default function styleConstructor(theme = {}) {
  const appStyle = { ...defaultStyle, ...theme };
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      minWidth: 36,
      minHeight: 36,
    },
    text: {
      marginTop: Platform.OS === 'android' ? 4 : 6,
      fontSize: appStyle.textDayFontSize,
      fontFamily: appStyle.textDayFontFamily,
      fontWeight: '600',
      color: appStyle.dayTextColor,
      backgroundColor: 'rgba(255, 255, 255, 0)',
    },
    alignedText: {
      marginTop: Platform.OS === 'android' ? 4 : 6,
    },
    selected: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4d6eff',
      width: 36,
      height: 36,
      borderRadius: 13,
    },
    today: {
      backgroundColor: appStyle.todayBackgroundColor,
    },
    todayCont: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#9b9b9b',
      width: 36,
      height: 36,
      borderRadius: 13,
    },
    todayText: {
      color: 'white',
    },
    selectedText: {
      color: appStyle.selectedDayTextColor,
    },
    disabledText: {
      color: appStyle.textDisabledColor,
    },
    dot: {
      width: 4,
      height: 4,
      marginTop: 1,
      borderRadius: 2,
      opacity: 0,
    },
    visibleDot: {
      opacity: 1,
      backgroundColor: appStyle.dotColor,
    },
    selectedDot: {
      backgroundColor: appStyle.selectedDotColor,
    },
    weekName: {
      textAlign: 'center',
      fontSize: 13,
      fontWeight: 'bold',
      color: '#989db3',
      fontFamily: 'AvenirNext-DemiBold',
    },
    ...(theme[STYLESHEET_ID] || {}),
  });
}

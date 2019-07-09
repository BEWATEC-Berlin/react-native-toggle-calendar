import React, {Component} from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Dimensions,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import {shouldUpdate} from '../../../component-updater';

import styleConstructor from './style';

const { width } = Dimensions.get('window');

const weekDaysNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

class Day extends Component {
  static propTypes = {
    // TODO: disabled props should be removed
    state: PropTypes.oneOf(['disabled', 'today', '']),

    // Specify theme properties to override specific styles for calendar parts. Default = {}
    theme: PropTypes.object,
    marking: PropTypes.any,
    onPress: PropTypes.func,
    onLongPress: PropTypes.func,
    date: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(props.theme);
    this.onDayPress = this.onDayPress.bind(this);
    this.onDayLongPress = this.onDayLongPress.bind(this);
  }

  onDayPress() {
    this.props.onPress(this.props.date);
  }
  onDayLongPress() {
    this.props.onLongPress(this.props.date);
  }

  shouldComponentUpdate(nextProps) {
    return shouldUpdate(this.props, nextProps, ['state', 'children', 'marking', 'onPress', 'onLongPress']);
  }

  getContentStyle = () => {
    if (isSameDay(new Date(this.props.selected), new Date(this.props.date.timestamp))) {
      return styles.selected;
    }
    if (isSameDay(new Date(), new Date(this.props.date.timestamp))) {
      if (this.props.selected) {
        return isSameDay(new Date(), new Date(this.props.date.timestamp))
          ? styles.current
          : styles.selected;
      }
      return !isSameDay(new Date(this.props.selected), new Date(this.props.date.timestamp))
        ? styles.selected
        : styles.current;
    }
    // if (isSameDay(new Date(admission), new Date(date.timestamp))) {
    //   return selected ? styles.current : styles.selected;
    // }
    return {};
  }

  render() {
    const containerStyle = [this.style.base];
    const textStyle = [this.style.text];
    const dotStyle = [this.style.dot];
    let selectedStyle = [];

    let marking = this.props.marking || {};
    if (marking && marking.constructor === Array && marking.length) {
      marking = {
        marking: true
      };
    }
    const isDisabled = typeof marking.disabled !== 'undefined' ? marking.disabled : this.props.state === 'disabled';
    let dot;
    if (marking.marked) {
      // dotStyle.push(this.style.visibleDot);
      if (marking.dotColor) {
        dotStyle.push({backgroundColor: marking.dotColor});
      }
      dot = (<View style={dotStyle} />);
    }

    if (marking.selected) {
      if (marking.selectedColor) {
        selectedStyle.push(this.style.selected)
      }
      dotStyle.push(this.style.selectedDot);
      textStyle.push(this.style.selectedText);
    } else if (isDisabled) {
      textStyle.push(this.style.disabledText);
    } else if (this.props.state === 'today') {
      containerStyle.push(this.style.today);
      textStyle.push(this.style.todayText);
      selectedStyle.push(this.style.todayCont)
    }
    if (marking.selectedColor) {
      // containerStyle.push();
      selectedStyle.push(this.style.selected)
    }
    containerStyle.push({ minWidth: width / 7.2 })
    const { horizontal, date } = this.props;
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={this.onDayPress}
        onLongPress={this.onDayLongPress}
        activeOpacity={marking.activeOpacity}
        disabled={marking.disableTouchEvent}
      >
        <View>
          {horizontal ? (
            <Text style={[this.style.weekName, {marginTop: -3, marginBottom: 10 }]} numberOfLines={1}>
              {weekDaysNames[date.weekDay].toUpperCase()}
            </Text>
          ) : null}
        </View>
        <View style={selectedStyle}>
          <Text allowFontScaling={false} style={textStyle}>{String(this.props.children)}</Text>
        </View>
        {dot}
      </TouchableOpacity>
    );
  }
}

export default Day;

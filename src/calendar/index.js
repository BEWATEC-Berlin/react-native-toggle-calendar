import React, {Component} from 'react';
import {
  View,
  ViewPropTypes,
  ScrollView,
  Dimensions
} from 'react-native';
import PropTypes from 'prop-types';

import XDate from 'xdate';
import dateutils from '../dateutils';
import {xdateToData, parseDate} from '../interface';
import * as Animatable from 'react-native-animatable';
import styleConstructor from './style';
import Day from './day/basic';
import UnitDay from './day/period';
import MultiDotDay from './day/multi-dot';
import MultiPeriodDay from './day/multi-period';
import SingleDay from './day/custom';
import CalendarHeader from './header';
import shouldComponentUpdate from './updater';

//Fallback when RN version is < 0.44
const viewPropTypes = ViewPropTypes || View.propTypes;

const EmptyArray = [];

const { width } = Dimensions.get('window');
// horizontal calendar will be scrolled to (offset * viewport width) to keep selected date visible
let horizontalScrollViewOffset = 0;

class Calendar extends Component {
  static propTypes = {
    // Specify theme properties to override specific styles for calendar parts. Default = {}
    theme: PropTypes.object,
    // Collection of dates that have to be marked. Default = {}
    markedDates: PropTypes.object,

    // Specify style for calendar container element. Default = {}
    style: viewPropTypes.style,
    // Initially visible month. Default = Date()
    current: PropTypes.any,
    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
    minDate: PropTypes.any,
    // Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined
    maxDate: PropTypes.any,

    // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
    firstDay: PropTypes.number,

    // Date marking style [simple/period/multi-dot/multi-period]. Default = 'simple'
    markingType: PropTypes.string,

    // Hide month navigation arrows. Default = false
    hideArrows: PropTypes.bool,
    // Display loading indicador. Default = false
    displayLoadingIndicator: PropTypes.bool,
    // Do not show days of other months in month page. Default = false
    hideExtraDays: PropTypes.bool,

    // Handler which gets executed on day press. Default = undefined
    onDayPress: PropTypes.func,
    // Handler which gets executed on day long press. Default = undefined
    onDayLongPress: PropTypes.func,
    // Handler which gets executed when visible month changes in calendar. Default = undefined
    onMonthChange: PropTypes.func,
    onVisibleMonthsChange: PropTypes.func,
    // Replace default arrows with custom ones (direction can be 'left' or 'right')
    renderArrow: PropTypes.func,
    // Provide custom day rendering component
    dayComponent: PropTypes.any,
    // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
    monthFormat: PropTypes.string,
    // Disables changing month when click on days of other months (when hideExtraDays is false). Default = false
    disableMonthChange: PropTypes.bool,
    //  Hide day names. Default = false
    hideDayNames: PropTypes.bool,
    // Disable days by default. Default = false
    disabledByDefault: PropTypes.bool,
    // Show week numbers. Default = false
    showWeekNumbers: PropTypes.bool,
    // Handler which gets executed when press arrow icon left. It receive a callback can go back month
    onPressArrowLeft: PropTypes.func,
    // Handler which gets executed when press arrow icon left. It receive a callback can go next month
    onPressArrowRight: PropTypes.func,
    // Provide custom calendar header rendering component
    calendarHeaderComponent: PropTypes.any,
    // data which is passed to calendar header, useful only when implementing custom calendar header
    headerData: PropTypes.object,
    // Handler which gets executed when press list icon. It will set calendar to horizontal
    onPressListView: PropTypes.func,
    // Handler which gets executed when press grid icon. It will set calendar to grid
    onPressGridView: PropTypes.func,
    // to show horizontal calendar with scroll
    horizontal: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(this.props.theme);
    let currentMonth;
    if (props.current) {
      currentMonth = parseDate(props.current);
    } else {
      currentMonth = XDate();
    }
    this.state = {
      currentMonth,
      horizontal: props.horizontal
    };

    this.updateMonth = this.updateMonth.bind(this);
    this.addMonth = this.addMonth.bind(this);
    this.pressDay = this.pressDay.bind(this);
    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.onLayout = this.onLayout.bind(this);
    this.longPressDay = this.longPressDay.bind(this);
    this.shouldComponentUpdate = shouldComponentUpdate;
    this.showDay = null;
    this.widthDay = 12;
    this.scrollWidth = 500;
    this.horizontalScrollViewRef = React.createRef();
  }

  componentWillReceiveProps(nextProps) {
    const current = parseDate(nextProps.current);
    if (current && current.toString('yyyy MM') !== this.state.currentMonth.toString('yyyy MM')) {
      this.setState({
        currentMonth: current.clone()
      });
    }
    if (this.props.showCurrentDate !== nextProps.showCurrentDate) {
      this.showCurrentDay();
    }
    if (this.props.scrollEnd !== nextProps.scrollEnd) {
      const horizontalScrollView = this.horizontalScrollViewRef.current;
      setTimeout(() => {
        horizontalScrollView.scrollTo({ x: this.scrollWidth, animated: false });
      }, 200)
    }
    if (this.props.scrollStart !== nextProps.scrollStart) {
      const horizontalScrollView = this.horizontalScrollViewRef.current;
      horizontalScrollView.scrollTo({ x: 0, animated: false });
    }
    this.setState({
      horizontal: nextProps.horizontal
    });
  }

  // scroll the horizontal calendar so that selected date is visible
  componentDidMount() {
    this.showDay = setTimeout(() => {
      this.showCurrentDay();
    }, 600);
  }

  componentWillUnmount() {
    clearTimeout(this.showDay);
    
  }

  showCurrentDay() {
    const horizontalScrollView = this.horizontalScrollViewRef.current;
    const day = xdateToData(new Date()).day;
    if (horizontalScrollView) {
      horizontalScrollView.scrollTo({
        x: ((day) * (width / 7.2)),
        animated: true
      });
    }
  }

  updateMonth(day, doNotTriggerListeners) {
    if (day.toString('yyyy MM') === this.state.currentMonth.toString('yyyy MM')) {
      return;
    }
    this.setState({
      currentMonth: day.clone()
    }, () => {
      if (!doNotTriggerListeners) {
        const currMont = this.state.currentMonth.clone();
        if (this.props.onMonthChange) {
          this.props.onMonthChange(xdateToData(currMont));
        }
        if (this.props.onVisibleMonthsChange) {
          this.props.onVisibleMonthsChange([xdateToData(currMont)]);
        }
      }
    });
  }

  _handleDayInteraction(date, interaction) {
    const day = parseDate(date);
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    if (!(minDate && !dateutils.isGTE(day, minDate)) && !(maxDate && !dateutils.isLTE(day, maxDate))) {
      const shouldUpdateMonth = this.props.disableMonthChange === undefined || !this.props.disableMonthChange;
      if (shouldUpdateMonth) {
        this.updateMonth(day);
      }
      if (interaction) {
        interaction(xdateToData(day));
      }
    }
  }

  pressDay(date) {
    this._handleDayInteraction(date, this.props.onDayPress);
  }

  longPressDay(date) {
    this._handleDayInteraction(date, this.props.onDayLongPress);
  }

  addMonth(count) {
    this.updateMonth(this.state.currentMonth.clone().addMonths(count, true));
  }

  renderDay(day, id) {
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    let state = '';
    if (this.props.disabledByDefault) {
      state = 'disabled';
    } else if ((minDate && !dateutils.isGTE(day, minDate)) || (maxDate && !dateutils.isLTE(day, maxDate))) {
      state = 'disabled';
    } else if (!dateutils.sameMonth(day, this.state.currentMonth)) {
      state = 'disabled';
    } else if (dateutils.sameDate(day, XDate())) {
      state = 'today';
    }

    if (!dateutils.sameMonth(day, this.state.currentMonth) && this.props.hideExtraDays) {
      return (<View key={id} style={{flex: 1}} />);
    }

    const DayComp = this.getDayComponent();
    const date = day.getDate();
    return (
      <View
        style={{flex: 1, alignItems: 'center'}}
        key={id}
        onLayout={({ nativeEvent }) => this.widthDay = nativeEvent.layout.width}
      >
        <DayComp
          state={state}
          theme={this.props.theme}
          onPress={this.pressDay}
          onLongPress={this.longPressDay}
          date={xdateToData(day)}
          marking={this.getDateMarking(day)}
          horizontal={this.props.horizontal}
          current={this.props.current}
        >
          {date}
        </DayComp>
      </View>
    );
  }

  getDayComponent() {
    if (this.props.dayComponent) {
      return this.props.dayComponent;
    }

    switch (this.props.markingType) {
    case 'period':
      return UnitDay;
    case 'multi-dot':
      return MultiDotDay;
    case 'multi-period':
      return MultiPeriodDay;
    case 'custom':
      return SingleDay;
    default:
      return Day;
    }
  }

  getDateMarking(day) {
    if (!this.props.markedDates) {
      return false;
    }
    const dates = this.props.markedDates[day.toString('yyyy-MM-dd')] || EmptyArray;
    if (dates.length || dates) {
      return dates;
    } else {
      return false;
    }
  }

  renderWeekNumber (weekNumber) {
    return <Day key={`week-${weekNumber}`} theme={this.props.theme} marking={{disableTouchEvent: true}} state='disabled'>{weekNumber}</Day>;
  }

  renderWeek(days, id) {
    const week = [];
    days.forEach((day, id2) => {
      week.push(this.renderDay(day, id2));

      // if day is selected (aka current) day then corresponding week row id will be offset
      if (day.getTime() === parseDate(this.props.current).getTime()) {
        horizontalScrollViewOffset = id;
      }
    }, this);

    if (this.props.showWeekNumbers) {
      week.unshift(this.renderWeekNumber(days[days.length - 1].getWeek()));
    }

    return (<Animatable.View animation={this.props.moveScrollViewTo} style={this.style.week} key={id}>{week}</Animatable.View>);
  }

  getCalendarHeaderComponent() {
    if (this.props.calendarHeaderComponent) {
      return this.props.calendarHeaderComponent;
    }

    return CalendarHeader;
  }
  onContentSizeChange(width) {
    this.scrollWidth = width;
    if (this.props.onScrollSizeChange) this.props.onScrollSizeChange(width);
  }
  onLayout({ nativeEvent }) {
    if (this.props.onLayoutScroll) this.props.onLayoutScroll(nativeEvent);
  }
  render() {
    const days = dateutils.page(this.state.currentMonth, this.props.firstDay);
    const weeks = [];
    while (days.length) {
      weeks.push(this.renderWeek(days.splice(0, 7), weeks.length));
    }
    let indicator;
    const current = parseDate(this.props.current);
    if (current) {
      const lastMonthOfDay = current.clone().addMonths(1, true).setDate(1).addDays(-1).toString('yyyy-MM-dd');
      if (this.props.displayLoadingIndicator &&
          !(this.props.markedDates && this.props.markedDates[lastMonthOfDay])) {
        indicator = true;
      }
    }
    const CalendarHeader = this.getCalendarHeaderComponent();

    return (
      <View style={[this.style.container, this.props.style]}>
        <CalendarHeader
          theme={this.props.theme}
          hideArrows={this.props.hideArrows}
          month={this.state.currentMonth}
          addMonth={this.addMonth}
          showIndicator={indicator}
          firstDay={this.props.firstDay}
          renderArrow={this.props.renderArrow}
          monthFormat={this.props.monthFormat}
          hideDayNames={this.props.hideDayNames}
          weekNumbers={this.props.showWeekNumbers}
          onPressArrowLeft={this.props.onPressArrowLeft}
          onPressArrowRight={this.props.onPressArrowRight}
          headerData={this.props.headerData}
          horizontal={this.props.horizontal}
          onPressListView={this.props.onPressListView}
          onPressGridView={this.props.onPressGridView}
        />
        {
          this.state.horizontal ?
            <ScrollView 
              style={[this.style.monthView, {marginBottom: 10}]}
              horizontal
              pagingEnabled
              onScrollEndDrag={this.props.onScrollEndDrag}
              showsHorizontalScrollIndicator={false}
              ref={this.horizontalScrollViewRef}
              onLayout={this.onLayout}
              onContentSizeChange={this.onContentSizeChange}
              bouncesZoom
            >
              {weeks}
            </ScrollView>
            : <View style={this.style.monthView}>{weeks}</View>
        }
      </View>);
  }
}

export default Calendar;

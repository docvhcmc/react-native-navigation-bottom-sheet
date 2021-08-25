import Animated from 'react-native-reanimated';
import {
  PanGestureHandler,
  TapGestureHandler,
  State as GestureState,
  gestureHandlerRootHOC,
} from 'react-native-gesture-handler';

import { runDecay, normalizeSnapPoints } from './utility';
import type {LayoutChangeEvent} from 'react-native';

const {
  call,
  cond,
  greaterThan,
  lessThan,
  neq,
  clockRunning,
  not,
  and,
  set,
  sub,
  or,
  stopClock,
  lessOrEq,
  proc,
  add,
  max,
  min,
  eq,
  multiply,
  block,
  onChange,
  Value
} = Animated;

class AnimatedStore {
  /* Clock used for an animation of a scrolling view (not implemented yet) */
  static _scrollingClock = new Animated.Clock();

  /* Value of a current dragging postion of content in the scroll view */
  static _scrollY: Animated.Value<number> = new Animated.Value(0);

  /* Value of a current speed of content dragging in the scroll view  */
  static _velocityScrollY: Animated.Value<number> = new Animated.Value(0);

  /* State of a gesture for a scroll view */
  static _panScrollState: Animated.Value<number> = new Animated.Value(
    GestureState.END
  );

  static _onGestureEventScrolling = Animated.event([
    {
      nativeEvent: {
        translationY: this._scrollY,
        velocityY: this._velocityScrollY,
        state: this._panScrollState,
      },
    },
  ]);

  static enabledContentGestureInteraction: boolean = true;
  static contentHeight: Animated.Value<number> = new Animated.Value(0);
  static headerHeight: number = 0;
  static snapPoints: readonly number[] = [];

  static _wasStarted: Animated.Value<number> = new Animated.Value(0);

  static init = (
    enabledContentGestureInteraction: boolean,
    snapPoints: readonly number[]
  ) => {
    this.snapPoints = snapPoints;
    this.enabledContentGestureInteraction = enabledContentGestureInteraction;
  }

  static handleLayoutHeader = ({
    nativeEvent: {
      layout: { height: heightOfHeader },
    },
  }: LayoutChangeEvent) => {
    this.headerHeight = heightOfHeader;
  };

  static handleLayoutContent = ({
    nativeEvent: {
      layout: { height },
    },
  }: LayoutChangeEvent) => {
    const resultHeight = this.enabledContentGestureInteraction
      ? height + this.headerHeight - this.snapPoints[this.snapPoints.length - 1]
      : 0;

    // console.log(height + this.state.heightOfHeader - this.snapPoints[this.snapPoints.length - 1]);
    // this.state.contentHeight.setValue(Math.max(resultHeight, 0));
    this.contentHeight.setValue(resultHeight);
    // console.log(this.contentHeight);
  };

  static limitedScroll = proc((val: Animated.Value<number>) =>
    max(min(val, 0), multiply(this.contentHeight, -1))
  );

  static _prevTransY: Animated.Value<number> = new Animated.Value(0);
  static _transY: Animated.Value<number> = new Animated.Value(0);

  static _masterScrollY = block([
    // cond(this._wasStarted, [stopClock(this._scrollingClock), set(this._wasStarted, 0)]),
    /* onChange(
      this._transY,
      call([this._velocityScrollY], (snapPoints: readonly number[]) =>
        console.log('Changed: ' + snapPoints[0])
      )
    ), */

    cond(
      or(
        eq(this._panScrollState, GestureState.ACTIVE),
        eq(this._panScrollState, GestureState.BEGAN)
      ),
      [
        set(this._wasStarted, 0),
        stopClock(this._scrollingClock),
        set(
          this._transY,
          this.limitedScroll(
            add(this._scrollY, this._prevTransY) as Animated.Value<number>
          )
        ),
        this._transY,
      ],
      [
        runDecay(
          this._scrollingClock,
          this._transY,
          this._velocityScrollY,
          this._transY,
          this._wasStarted,
          this.contentHeight
        ),
        set(this._prevTransY, this._transY),
        this._transY,
      ]
    ),
  ]);
}

/* const animated_scroll_store = new AnimatedStore();

export default animated_scroll_store; */

export default AnimatedStore;


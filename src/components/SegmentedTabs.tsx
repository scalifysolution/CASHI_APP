import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

type Props<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;

  /** Outer container style (track). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Individual tab press area style. */
  tabStyle?: StyleProp<ViewStyle>;
  /** Text style for inactive labels. */
  textStyle?: StyleProp<TextStyle>;
  /** Text style for active label. */
  activeTextStyle?: StyleProp<TextStyle>;
  /** Sliding pill style (active indicator). */
  indicatorStyle?: StyleProp<ViewStyle>;

  /** Inner padding between track and pill. Default: 3 */
  inset?: number;
};

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  containerStyle,
  tabStyle,
  textStyle,
  activeTextStyle,
  indicatorStyle,
  inset = 3,
}: Props<T>) {
  const [w, setW] = useState(0);
  const idx = useMemo(() => Math.max(0, options.indexOf(value)), [options, value]);
  const x = useRef(new Animated.Value(0)).current;

  const count = Math.max(1, options.length);
  const trackW = Math.max(0, w - inset * 2);
  const pillW = count > 0 ? trackW / count : 0;

  useEffect(() => {
    if (!w || !pillW) return;
    Animated.spring(x, {
      toValue: idx * pillW,
      useNativeDriver: true,
      stiffness: 260,
      damping: 28,
      mass: 0.9,
    }).start();
  }, [idx, pillW, w, x]);

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[styles.container, containerStyle]}
    >
      {w > 0 && pillW > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { top: inset, bottom: inset, left: inset, width: pillW, transform: [{ translateX: x }] },
            indicatorStyle,
          ]}
        />
      ) : null}

      {options.map((opt) => {
        const isActive = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.tab, tabStyle]}
          >
            <Text style={[styles.text, textStyle, isActive && activeTextStyle]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});


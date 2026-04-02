import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { brand } from '../../theme';

type Props = {
  /** Icon width/height in px */
  size?: number;
  strokeColor?: string;
  showBadge?: boolean;
};

/**
 * Outline bell (Feather-style paths) — crisp on any density vs hand-built Views.
 */
export function NotificationBellIcon({
  size = 22,
  strokeColor = '#FFFFFF',
  showBadge = true,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.73 21a2 2 0 0 1-3.46 0"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      {showBadge ? <View style={styles.badge} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: brand.blue,
    borderWidth: 2,
    borderColor: brand.dark,
  },
});

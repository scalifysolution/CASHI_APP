import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { HomeSideMenu } from '../components/HomeSideMenu';
import { CouponsScreen } from '../screens/CouponsScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { brand } from '../theme';
import { HomeMenuProvider, useHomeMenu } from './HomeMenuContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// --- High-Fidelity Vector Icons ---

const IconWrapper = ({
  children,
  focused,
}: {
  children: ReactNode;
  focused: boolean;
}) => (
  <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
    {children}
  </View>
);

const HomeIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

const CouponsIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <Path d="M7 7h.01" />
  </Svg>
);

/** Bar chart — earnings / growth */
const EarningsIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 20V10" />
    <Path d="M12 20V4" />
    <Path d="M6 20v-4" />
  </Svg>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

function HomeMenuLayer() {
  const { menuVisible, setMenuVisible, rootNavigation } = useHomeMenu();
  return (
    <HomeSideMenu
      visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      navigation={rootNavigation}
    />
  );
}

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const tabNavigation = useNavigation();
  const rootNavigation = tabNavigation.getParent?.() ?? tabNavigation;

  return (
    <HomeMenuProvider rootNavigation={rootNavigation}>
      <View style={styles.tabShell}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: brand.blue,
            tabBarInactiveTintColor: brand.helperColor,
            tabBarShowLabel: true,
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: [
              styles.tabBar,
              {
                paddingBottom: bottomPad,
                height: 58 + bottomPad,
              },
            ],
          }}>
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <IconWrapper focused={focused}>
                  <HomeIcon color={color} />
                </IconWrapper>
              ),
            }}
          />
          <Tab.Screen
            name="Coupons"
            component={CouponsScreen}
            options={{
              tabBarLabel: 'Coupons',
              tabBarIcon: ({ color, focused }) => (
                <IconWrapper focused={focused}>
                  <CouponsIcon color={color} />
                </IconWrapper>
              ),
            }}
          />
          <Tab.Screen
            name="Earnings"
            component={EarningsScreen}
            options={{
              tabBarLabel: 'Earnings',
              tabBarIcon: ({ color, focused }) => (
                <IconWrapper focused={focused}>
                  <EarningsIcon color={color} />
                </IconWrapper>
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
              tabBarIcon: ({ color, focused }) => (
                <IconWrapper focused={focused}>
                  <ProfileIcon color={color} />
                </IconWrapper>
              ),
            }}
          />
        </Tab.Navigator>
        <HomeMenuLayer />
      </View>
    </HomeMenuProvider>
  );
}

const styles = StyleSheet.create({
  tabShell: { flex: 1 },
  tabBar: {
    left: 20,
    right: 20,
    backgroundColor: brand.surface,
    borderTopWidth: 0,
    paddingTop: 10,

    // Premium Soft Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconBoxActive: {
    backgroundColor: brand.blueLight, // Subtle highlight when active
  },
});
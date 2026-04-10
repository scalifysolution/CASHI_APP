import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { MainTabNavigator } from './MainTabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { MerchantPortalScreen } from '../screens/MerchantPortalScreen';
import { MyLoyaltyScreen } from '../screens/MyLoyaltyScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { InviteScreen } from '../screens/InviteScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { StartCashiOnboardingScreen } from '../screens/StartCashiOnboardingScreen';
import { WebPageScreen } from '../screens/WebPageScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { OtpVerificationScreen } from '../screens/OtpVerificationScreen';
import { CouponsScreen } from '../screens/CouponsScreen';
import { ShopsDirectoryScreen } from '../screens/ShopsDirectoryScreen';
import { CouponPassScreen } from '../screens/CouponPassScreen';
import { ShopDetailScreen } from '../screens/ShopDetailScreenFixed';
import { ScannerScreen } from '../screens/ScannerScreen';
import type { RootStackParamList } from './types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { bootstrapAuth } from '../store/authSlice';
import { View } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const token = useAppSelector((s) => s.auth.accessToken);
  const profileComplete = useAppSelector((s) => s.user.profileComplete);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  // Simple splash while we hydrate AsyncStorage
  if (!hydrated) return <View style={{ flex: 1 }} />;

  const navKey = token ? 'app' : 'auth';
  const initialRouteName = token
    ? profileComplete
      ? 'MainTabs'
      : 'Onboarding'
    : 'Login';

  return (
    <Stack.Navigator
      key={navKey}
      initialRouteName={initialRouteName}
      screenOptions={{
        animation: 'slide_from_right',
      }}>
      {token ? (
        <>
          {!profileComplete ? (
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
          ) : null}
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{
              headerShown: false,
              /** Lets Home side menu absolute overlay paint above the sheet without being clipped */
              contentStyle: { overflow: 'visible' },
            }}
          />
          <Stack.Screen
            name="CouponsFromMenu"
            component={CouponsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CouponPass"
            component={CouponPassScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyLoyalty"
            component={MyLoyaltyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Invite"
            component={InviteScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Rewards"
            component={RewardsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StartCashiOnboarding"
            component={StartCashiOnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MerchantPortal"
            component={MerchantPortalScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WebPage"
            component={WebPageScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ShopsDirectory"
            component={ShopsDirectoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ShopDetail"
            component={ShopDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OtpVerification"
            component={OtpVerificationScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

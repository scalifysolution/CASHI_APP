import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { MerchantPortalScreen } from '../screens/MerchantPortalScreen';
import { MyLoyaltyScreen } from '../screens/MyLoyaltyScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { InviteScreen } from '../screens/InviteScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { StartCashiOnboardingScreen } from '../screens/StartCashiOnboardingScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { OtpVerificationScreen } from '../screens/OtpVerificationScreen';
import { CouponsScreen } from '../screens/CouponsScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        animation: 'slide_from_right',
      }}>
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
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
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
        name="EarningsFromMenu"
        component={EarningsScreen}
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
    </Stack.Navigator>
  );
}

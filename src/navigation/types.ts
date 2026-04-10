import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type MainTabParamList = {
  Home: undefined;
  Coupons: undefined;
  Scanner: undefined;
  MyLoyalty: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  OtpVerification: { phone: string };
  Onboarding: undefined;
  MainTabs: undefined;
  /** Same UI as tab Coupons, pushed from side menu so back returns to Home */
  CouponsFromMenu: undefined;
  CouponPass: { item: any };
  ShopDetail: { shop: any };
  Scanner: undefined;
  MyLoyalty: undefined;
  Notifications: undefined;
  Invite: undefined;
  Rewards: undefined;
  EditProfile: undefined;
  StartCashiOnboarding: undefined;
  MerchantPortal: undefined;
  WebPage: { title: string; url: string };
  ShopsDirectory: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

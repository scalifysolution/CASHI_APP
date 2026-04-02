import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type BusinessProfile = {
  storeName: string;
  category: string;
  addressLine: string;
  city: string;
  pincode: string;
};

export type UserState = {
  /** Populated after auth / API — placeholders for now */
  id: string | null;
  displayName: string;
  phone: string;
  email: string;
  /** True after user finishes Start Cashi onboarding */
  cashiBusiness: boolean;
  business: BusinessProfile | null;
};

const initialState: UserState = {
  id: null,
  displayName: 'Mohan',
  phone: '+91 99999 00000',
  email: 'mohan@example.com',
  cashiBusiness: false,
  business: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /** Merge partial user — use after login / API */
    setUser(state, action: PayloadAction<Partial<UserState>>) {
      Object.assign(state, action.payload);
    },
    completeStartCashi(state, action: PayloadAction<BusinessProfile>) {
      state.cashiBusiness = true;
      state.business = action.payload;
    },
    /** For testing / future account downgrade */
    clearBusiness(state) {
      state.cashiBusiness = false;
      state.business = null;
    },
  },
});

export const { setUser, completeStartCashi, clearBusiness } = userSlice.actions;
export const userReducer = userSlice.reducer;

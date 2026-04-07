import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { loadUserProfile } from './userStorage';

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
  role: string;
  referenceCode: string;
  profileComplete: boolean;
  /** True after user finishes Start Cashi onboarding */
  cashiBusiness: boolean;
  business: BusinessProfile | null;
};

const initialState: UserState = {
  id: null,
  displayName: '',
  phone: '',
  email: '',
  role: '',
  referenceCode: '',
  profileComplete: false,
  cashiBusiness: false,
  business: null,
};

export const bootstrapUserProfile = createAsyncThunk(
  'user/bootstrapProfile',
  async (_, thunkApi) => {
    const profile = await loadUserProfile();
    if (profile) {
      thunkApi.dispatch(
        setUser({
          displayName: profile.displayName ?? undefined,
          email: profile.email ?? undefined,
          phone: profile.phone ?? undefined,
          referenceCode: profile.referenceCode ?? undefined,
          profileComplete: profile.profileComplete ?? undefined,
        }),
      );
    }
    return profile;
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /** Merge partial user — use after login / API */
    setUser(state, action: PayloadAction<Partial<UserState>>) {
      Object.assign(state, action.payload);
    },
    resetUser() {
      return initialState;
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

export const { setUser, resetUser, completeStartCashi, clearBusiness } =
  userSlice.actions;
export const userReducer = userSlice.reducer;

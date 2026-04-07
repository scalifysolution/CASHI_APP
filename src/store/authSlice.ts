import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '../api/client';
import { ApiException } from '../api/http';
import { clearAccessToken, loadAccessToken, saveAccessToken } from './authStorage';
import { resetUser, setUser, type UserState } from './userSlice';
import { clearUserProfile, loadUserProfile, saveUserProfile } from './userStorage';

type TokenResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
};

type OtpRequestResponse =
  | { otpSent: true; devOtp?: string }
  | { otpSent: boolean; devOtp?: string };

export type AuthState = {
  hydrated: boolean;
  accessToken: string | null;
  phoneForOtp: string | null;
  devOtp: string | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
};

const initialState: AuthState = {
  hydrated: false,
  accessToken: null,
  phoneForOtp: null,
  devOtp: null,
  status: 'idle',
  error: null,
};

function messageFromUnknown(e: unknown, fallback: string): string {
  if (e instanceof ApiException) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async (_, thunkApi) => {
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
  const token = await loadAccessToken();
  if (token) {
    thunkApi.dispatch(setAccessToken(token));
    try {
      await thunkApi.dispatch(fetchMe()).unwrap();
    } catch {
      // 401: fetchMe clears auth; other errors leave token but skip blocking splash forever
    }
  }
  return { token };
});

export const requestOtp = createAsyncThunk<
  OtpRequestResponse,
  string,
  { rejectValue: string }
>('auth/requestOtp', async (phone: string, { dispatch, rejectWithValue }) => {
  dispatch(setOtpPhone(phone));
  try {
    const res = await apiRequest<OtpRequestResponse>('/auth/otp/request', {
      method: 'POST',
      body: { phone },
    });
    return res;
  } catch (e) {
    return rejectWithValue(messageFromUnknown(e, 'Failed to send OTP'));
  }
});

export const verifyOtp = createAsyncThunk<
  TokenResponse,
  { phone: string; code: string },
  { rejectValue: string }
>('auth/verifyOtp', async (args, { dispatch, rejectWithValue }) => {
  try {
    const res = await apiRequest<TokenResponse>('/auth/otp/verify', {
      method: 'POST',
      body: { phone: args.phone, code: args.code },
    });
    await saveAccessToken(res.accessToken);
    /** Load /auth/me before setting accessToken in Redux so RootNavigator never opens Onboarding when profile is already complete on the server. */
    try {
      await dispatch(fetchMe(res.accessToken)).unwrap();
    } catch {
      dispatch(setUser({ phone: args.phone }));
    }
    dispatch(setAccessToken(res.accessToken));
    return res;
  } catch (e) {
    return rejectWithValue(messageFromUnknown(e, 'Invalid OTP'));
  }
});

export const fetchMe = createAsyncThunk<
  unknown,
  string | undefined
>('auth/me', async (tokenOverride, thunkApi) => {
  const state = thunkApi.getState() as any;
  const token: string | null =
    typeof tokenOverride === 'string' && tokenOverride.length > 0
      ? tokenOverride
      : state?.auth?.accessToken ?? null;
  let me: any;
  try {
    me = await apiRequest<any>('/auth/me', { method: 'GET', token });
  } catch (e: any) {
    if (e?.statusCode === 401) {
      await clearAccessToken();
      thunkApi.dispatch(clearAuth());
      thunkApi.dispatch(resetUser());
    }
    throw e;
  }
  if (me && typeof me === 'object') {
    const id = (me as any).sub ?? (me as any).id ?? null;
    const email = (me as any).email ?? '';
    const role = String((me as any).role ?? '').toUpperCase();
    const phone = String((me as any).phone ?? '').trim();
    const name = String((me as any).name ?? '').trim();

    const updates: Partial<UserState> = { id, email };
    if (role) updates.role = role;
    if (phone) updates.phone = phone;
    if (name.length >= 2) {
      updates.displayName = name;
      updates.profileComplete = true;
    }

    thunkApi.dispatch(setUser(updates));

    if (name.length >= 2) {
      const st = thunkApi.getState() as { user?: UserState };
      const ref = st?.user?.referenceCode ?? '';
      const phoneForStore = phone || st?.user?.phone || '';
      await saveUserProfile({
        displayName: name,
        email,
        phone: phoneForStore,
        referenceCode: ref,
        profileComplete: true,
      });
    }
  }
  return me;
});

export const logout = createAsyncThunk('auth/logout', async (_, thunkApi) => {
  const state = thunkApi.getState() as any;
  const token: string | null = state?.auth?.accessToken ?? null;
  try {
    // Best-effort server logout (invalidates tokenVersion).
    await apiRequest('/auth/logout', { method: 'POST', token });
  } catch {
    // ignore
  } finally {
    await clearAccessToken();
    await clearUserProfile();
    thunkApi.dispatch(clearAuth());
    thunkApi.dispatch(resetUser());
  }
});

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
    },
    setOtpPhone(state, action: PayloadAction<string | null>) {
      state.phoneForOtp = action.payload;
    },
    clearAuth(state) {
      state.accessToken = null;
      state.phoneForOtp = null;
      state.devOtp = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(bootstrapAuth.fulfilled, (state) => {
      state.hydrated = true;
    });
    b.addCase(bootstrapAuth.rejected, (state) => {
      state.hydrated = true;
    });

    b.addCase(requestOtp.pending, (state) => {
      state.status = 'loading';
      state.error = null;
      state.devOtp = null;
    });
    b.addCase(requestOtp.fulfilled, (state, action) => {
      state.status = 'idle';
      state.devOtp = action.payload.devOtp ?? null;
    });
    b.addCase(requestOtp.rejected, (state, action) => {
      state.status = 'error';
      state.error =
        (typeof action.payload === 'string' ? action.payload : null) ??
        action.error.message ??
        'Failed to send OTP';
    });

    b.addCase(verifyOtp.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    b.addCase(verifyOtp.fulfilled, (state) => {
      state.status = 'idle';
      state.error = null;
    });
    b.addCase(verifyOtp.rejected, (state, action) => {
      state.status = 'error';
      state.error =
        (typeof action.payload === 'string' ? action.payload : null) ??
        action.error.message ??
        'Invalid OTP';
    });

    b.addCase(fetchMe.fulfilled, (_state, action) => {
      void action;
    });
  },
});

export const { setAccessToken, setOtpPhone, clearAuth } = slice.actions;
export const authReducer = slice.reducer;


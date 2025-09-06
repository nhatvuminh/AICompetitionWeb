import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import CryptoJS from 'crypto-js'

// Types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  isEmailVerified: boolean
  image?: string
}

export interface AuthTokens {
  access: {
    token: string
    expires: string
  }
  refresh: {
    token: string
    expires: string
  }
}

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  twoFactorRequired: boolean
  twoFactorSessionId: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TwoFactorRequest {
  sessionId: string
  code: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
  requiresTwoFactor?: boolean
  sessionId?: string
}

// Remove MD5 hashing as API handles it on server side

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  twoFactorRequired: false,
  twoFactorSessionId: null,
}

// Auth slice for local state
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User
        tokens: AuthTokens
      }>
    ) => {
      const { user, tokens } = action.payload
      state.user = user
      state.tokens = tokens
      state.isAuthenticated = true
      state.twoFactorRequired = false
      state.twoFactorSessionId = null
    },
    setTwoFactorRequired: (
      state,
      action: PayloadAction<{ sessionId: string }>
    ) => {
      state.twoFactorRequired = true
      state.twoFactorSessionId = action.payload.sessionId
    },
    clearCredentials: (state) => {
      state.user = null
      state.tokens = null
      state.isAuthenticated = false
      state.twoFactorRequired = false
      state.twoFactorSessionId = null
    },
  },
})

// RTK Query API slice
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://172.20.10.6:3000/v1/',
    prepareHeaders: (headers, { getState }) => {
      const tokens = (getState() as { auth: AuthState }).auth?.tokens
      if (tokens?.access?.token) {
        headers.set('authorization', `Bearer ${tokens.access.token}`)
      }
      return headers
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: ({ email, password }) => ({
        url: 'auth/login',
        method: 'POST',
        body: {
          email,
          password,
        },
      }),
    }),
    verifyTwoFactor: builder.mutation<AuthResponse, TwoFactorRequest>({
      query: ({ sessionId, code }) => ({
        url: 'auth/verify-2fa',
        method: 'POST',
        body: {
          sessionId,
          code,
        },
      }),
    }),
    refreshToken: builder.mutation<AuthTokens, { refreshToken: string }>({
      query: ({ refreshToken }) => ({
        url: 'auth/refresh-tokens',
        method: 'POST',
        body: { refreshToken },
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => 'auth/me',
      providesTags: ['User'],
    }),
  }),
})

export const {
  useLoginMutation,
  useVerifyTwoFactorMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
} = authApi

export const { setCredentials, setTwoFactorRequired, clearCredentials } = authSlice.actions
export default authSlice.reducer

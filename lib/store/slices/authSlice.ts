import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import CryptoJS from 'crypto-js'

// Types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  image?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  twoFactorRequired: boolean
  twoFactorSessionId: string | null
}

export interface LoginRequest {
  email?: string
  username?: string
  password: string
}

export interface TwoFactorRequest {
  sessionId: string
  code: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  requiresTwoFactor?: boolean
  sessionId?: string
}

// Helper function to hash password with MD5
export const hashPassword = (password: string): string => {
  return CryptoJS.MD5(password).toString()
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
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
        token: string
        refreshToken: string
      }>
    ) => {
      const { user, token, refreshToken } = action.payload
      state.user = user
      state.token = token
      state.refreshToken = refreshToken
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
      state.token = null
      state.refreshToken = null
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
    baseUrl: '/api/auth/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: AuthState }).auth?.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: ({ email, username, password }) => {
        const body: any = {
          password: hashPassword(password), // Hash password before sending
        }
        
        if (email) {
          body.email = email
        }
        if (username) {
          body.username = username
        }
        
        return {
          url: 'login',
          method: 'POST',
          body,
        }
      },
    }),
    verifyTwoFactor: builder.mutation<AuthResponse, TwoFactorRequest>({
      query: ({ sessionId, code }) => ({
        url: 'verify-2fa',
        method: 'POST',
        body: {
          sessionId,
          code,
        },
      }),
    }),
    refreshToken: builder.mutation<
      { token: string; refreshToken: string },
      { refreshToken: string }
    >({
      query: ({ refreshToken }) => ({
        url: 'refresh',
        method: 'POST',
        body: { refreshToken },
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'logout',
        method: 'POST',
      }),
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => 'me',
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

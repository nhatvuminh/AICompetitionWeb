import { configureStore } from '@reduxjs/toolkit'
import authReducer, { authApi } from './slices/authSlice'
import { documentsApi } from './slices/documentsSlice'
import { reportsApi } from './slices/reportsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [documentsApi.reducerPath]: documentsApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(
      authApi.middleware,
      documentsApi.middleware,
      reportsApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Types
export interface ReportStats {
  totalDocuments: number
  documentsWithSensitiveData: number
  totalUsers: number
  uploadsThisMonth: number
  sensitiveDataByType: {
    pii: number
    financial: number
    medical: number
    confidential: number
  }
  documentsByStatus: {
    uploading: number
    processing: number
    completed: number
    error: number
    sensitive_detected: number
  }
  uploadTrends: {
    date: string
    uploads: number
    sensitiveDetected: number
  }[]
  topUsers: {
    userId: string
    userName: string
    userEmail: string
    documentCount: number
    sensitiveDataCount: number
  }[]
}

export interface ActivityLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  userEmail: string
  action: 'upload' | 'download' | 'share' | 'delete' | 'view' | 'login' | 'logout'
  documentId?: string
  documentName?: string
  details: string
  ipAddress: string
  userAgent: string
}

export interface ReportFilters {
  dateFrom?: string
  dateTo?: string
  userId?: string
  action?: ActivityLog['action']
  documentId?: string
}

// RTK Query API slice
export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/reports/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Reports', 'ActivityLogs'],
  endpoints: (builder) => ({
    getStats: builder.query<ReportStats, ReportFilters>({
      query: (filters) => ({
        url: 'stats',
        params: filters,
      }),
      providesTags: ['Reports'],
    }),
    getActivityLogs: builder.query<
      { logs: ActivityLog[]; total: number; page: number; limit: number },
      ReportFilters & { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 50, ...filters }) => ({
        url: 'activity',
        params: { page, limit, ...filters },
      }),
      providesTags: ['ActivityLogs'],
    }),
    exportReport: builder.mutation<
      Blob,
      { type: 'stats' | 'activity'; filters: ReportFilters; format: 'pdf' | 'csv' }
    >({
      query: ({ type, filters, format }) => ({
        url: `export/${type}`,
        method: 'POST',
        body: { filters, format },
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
})

export const {
  useGetStatsQuery,
  useGetActivityLogsQuery,
  useExportReportMutation,
} = reportsApi

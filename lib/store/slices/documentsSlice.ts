import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { AuthState } from './authSlice'

// Types based on API response
export interface PIIResult {
  group_id: string
  type_en: string
  type_vi: string
  value: string
  sen_type: string
}

export interface DocumentUser {
  role: 'admin' | 'user'
  isEmailVerified: boolean
  name: string
  email: string
  id: string
}

export interface Document {
  id: string
  status: 'active' | 'processing' | 'completed' | 'error' | 'sensitive_detected'
  piiResult: PIIResult[] | null // Can be null or array
  isPublic: boolean
  filename: string
  originalname: string
  mimetype: string
  size: number
  path: string
  uploadedBy: DocumentUser
  lastModifiedBy: DocumentUser
  fileExtension: string
  permissions: any[]
  createdAt?: string
  updatedAt?: string
  // Computed fields for UI
  uploadedAt?: string // Alias for createdAt for backward compatibility
}

export interface DocumentsResponse {
  code: number
  data: {
    results: Document[]
    page: number
    limit: number
    totalPages: number
    totalResults: number
  }
}

export interface UploadResponse {
  code: number
  message: string
  fileId: string
  filename: string
  originalname: string
  originalFilename: string
  mimetype: string
  size: number
  fileExtension: string
  status: string
  uploadedBy: string
  createdAt: string
  updatedAt: string
  fileNameProcessed: boolean
  piiResult: PIIResult[]
}

export interface DocumentFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

// Documents API slice
export const documentsApi = createApi({
  reducerPath: 'documentsApi',
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
  tagTypes: ['Document'],
  endpoints: (builder) => ({
    getDocuments: builder.query<Document[], DocumentFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams()
        if (filters?.search) params.append('search', filters.search)
        if (filters?.status) params.append('status', filters.status)
        if (filters?.page) params.append('page', filters.page.toString())
        if (filters?.limit) params.append('limit', filters.limit.toString())
        
        return {
          url: `files?${params.toString()}`,
          method: 'GET',
        }
      },
      transformResponse: (response: DocumentsResponse) => {
        // Transform piiResult from JSON string to array if needed
        return response.data.results.map(doc => ({
          ...doc,
          piiResult: typeof doc.piiResult === 'string' 
            ? JSON.parse(doc.piiResult as any) 
            : doc.piiResult,
          // Map API status to frontend status
          status: doc.piiResult && Array.isArray(doc.piiResult) && doc.piiResult.length > 0 
            ? 'sensitive_detected' as const
            : 'completed' as const,
          // Add uploadedAt alias for backward compatibility
          uploadedAt: doc.createdAt
        }))
      },
      providesTags: ['Document'],
    }),
    
    uploadDocument: builder.mutation<UploadResponse, FormData>({
      query: (formData) => ({
        url: 'files/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Document'],
    }),
    
    deleteDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `files/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Document'],
    }),
    
    getDocument: builder.query<Document, string>({
      query: (id) => `files/${id}`,
      transformResponse: (response: Document) => ({
        ...response,
        piiResult: typeof response.piiResult === 'string' 
          ? JSON.parse(response.piiResult as any) 
          : response.piiResult,
        // Add uploadedAt alias for backward compatibility
        uploadedAt: response.createdAt
      }),
      providesTags: ['Document'],
    }),
  }),
})

export const {
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentQuery,
} = documentsApi

export default documentsApi.reducer
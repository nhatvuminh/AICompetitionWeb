import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Types
export interface Document {
  id: string
  name: string
  type: string
  size: number
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'sensitive_detected'
  uploadedAt: string
  processedAt?: string
  sensitiveData?: SensitiveDataInfo[]
  sharedWith?: DocumentPermission[]
  uploadedBy: {
    id: string
    name: string
    email: string
  }
}

export interface SensitiveDataInfo {
  type: 'pii' | 'financial' | 'medical' | 'confidential'
  content: string
  position: {
    page: number
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  severity: 'low' | 'medium' | 'high'
}

export interface DocumentPermission {
  userId: string
  userEmail: string
  userName: string
  permission: 'read' | 'write' | 'admin'
  grantedAt: string
  grantedBy: string
}

export interface UploadDocumentRequest {
  file: File
}

export interface ShareDocumentRequest {
  documentId: string
  userIds: string[]
  permission: 'read' | 'write' | 'admin'
}

export interface DocumentFilters {
  status?: Document['status']
  type?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

// RTK Query API slice
export const documentsApi = createApi({
  reducerPath: 'documentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/documents/',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Document', 'DocumentList'],
  endpoints: (builder) => ({
    getDocuments: builder.query<Document[], DocumentFilters>({
      query: (filters) => ({
        url: '',
        params: filters,
      }),
      providesTags: ['DocumentList'],
    }),
    getDocument: builder.query<Document, string>({
      query: (id) => `${id}`,
      providesTags: (result, error, id) => [{ type: 'Document', id }],
    }),
    uploadDocument: builder.mutation<Document, UploadDocumentRequest>({
      query: ({ file }) => {
        const formData = new FormData()
        formData.append('file', file)
        return {
          url: 'upload',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['DocumentList'],
    }),
    shareDocument: builder.mutation<void, ShareDocumentRequest>({
      query: ({ documentId, userIds, permission }) => ({
        url: `${documentId}/share`,
        method: 'POST',
        body: { userIds, permission },
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: 'Document', id: documentId },
        'DocumentList',
      ],
    }),
    updateDocumentPermissions: builder.mutation<
      void,
      { documentId: string; permissions: DocumentPermission[] }
    >({
      query: ({ documentId, permissions }) => ({
        url: `${documentId}/permissions`,
        method: 'PUT',
        body: { permissions },
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: 'Document', id: documentId },
      ],
    }),
    deleteDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: id,
        method: 'DELETE',
      }),
      invalidatesTags: ['DocumentList'],
    }),
    downloadDocument: builder.mutation<Blob, string>({
      query: (id) => ({
        url: `${id}/download`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
    getDocumentContent: builder.query<
      { content: string; sensitiveData: SensitiveDataInfo[] },
      string
    >({
      query: (id) => `${id}/content`,
    }),
  }),
})

export const {
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useUploadDocumentMutation,
  useShareDocumentMutation,
  useUpdateDocumentPermissionsMutation,
  useDeleteDocumentMutation,
  useDownloadDocumentMutation,
  useGetDocumentContentQuery,
} = documentsApi

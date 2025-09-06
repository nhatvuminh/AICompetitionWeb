'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Document, Page, pdfjs } from 'react-pdf'
import { useGetDocumentQuery, useGetDocumentContentQuery } from '@/lib/store/slices/documentsSlice'
import { useAuth } from '@/hooks/use-auth'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'

// Configure react-pdf worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface SensitiveHighlight {
  id: string
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

const sensitiveTypeColors = {
  pii: 'bg-blue-100 border-blue-500 text-blue-800',
  financial: 'bg-green-100 border-green-500 text-green-800',
  medical: 'bg-red-100 border-red-500 text-red-800',
  confidential: 'bg-amber-100 border-amber-500 text-amber-800',
}

const severityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
}

export default function DocumentViewerPage() {
  const { id } = useParams()
  const router = useRouter()
  const { isAdmin } = useAuth()
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null)
  
  const { data: document, isLoading: documentLoading, error: documentError } = useGetDocumentQuery(id as string)
  const { data: content, isLoading: contentLoading } = useGetDocumentContentQuery(id as string, {
    skip: !document || document.status !== 'completed'
  })

  if (documentLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Loading Document...">
          <div className="flex items-center justify-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading document...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (documentError || !document) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Document Not Found">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Icons.warning className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Document Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The document you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <Button asChild>
                  <Link href="/dashboard/documents">
                    <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
                    Back to Documents
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isPDF = document.type.toLowerCase().includes('pdf')
  const sensitiveData = document.sensitiveData || []

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages)
  }

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.2))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }

  const getHighlightsForPage = (pageNum: number) => {
    return sensitiveData.filter(item => item.position.page === pageNum)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title={document.name}
        description={`Document uploaded on ${format(new Date(document.uploadedAt), 'MMM d, yyyy')}`}
        headerActions={
          <div className="flex gap-2">
            {(document.status === 'completed' || document.status === 'sensitive_detected') && (
              <Button variant="outline">
                <Icons.add className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/admin/permissions?document=${document.id}`}>
                  <Icons.settings className="mr-2 h-4 w-4" />
                  Manage Access
                </Link>
              </Button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Document Viewer */}
          <div className="lg:col-span-3 space-y-4">
            {/* Document Status */}
            {document.status !== 'completed' && document.status !== 'sensitive_detected' && (
              <Alert>
                <Icons.spinner className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Document is currently being processed. Please wait...
                </AlertDescription>
              </Alert>
            )}

            {/* Sensitive Data Alert */}
            {sensitiveData.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                <Icons.warning className="h-4 w-4" />
                <AlertDescription className="text-amber-800 dark:text-amber-300">
                  <strong>Security Warning:</strong> This document contains {sensitiveData.length} potentially sensitive information item(s). 
                  Review the highlighted areas carefully before sharing.
                </AlertDescription>
              </Alert>
            )}

            {/* PDF Viewer */}
            {isPDF && document.status === 'completed' && (
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage <= 1}
                      >
                        <Icons.chevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage >= totalPages}
                      >
                        <Icons.chevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={zoomOut}>
                        <Icons.arrowRight className="h-4 w-4 rotate-45" />
                      </Button>
                      <span className="text-sm">{Math.round(scale * 100)}%</span>
                      <Button variant="outline" size="sm" onClick={zoomIn}>
                        <Icons.arrowRight className="h-4 w-4 -rotate-45" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="border rounded-lg overflow-auto max-h-[800px]">
                    <Document
                      file={`/api/documents/${document.id}/content`}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="flex items-center justify-center h-64">
                          <Icons.spinner className="h-6 w-6 animate-spin" />
                        </div>
                      }
                    >
                      <div className="relative">
                        <Page 
                          pageNumber={currentPage} 
                          scale={scale}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                        
                        {/* Sensitive Data Highlights */}
                        {getHighlightsForPage(currentPage).map((highlight) => (
                          <div
                            key={highlight.content}
                            className={cn(
                              'absolute border-2 opacity-70 cursor-pointer transition-all',
                              sensitiveTypeColors[highlight.type],
                              selectedHighlight === highlight.content && 'opacity-90 shadow-lg'
                            )}
                            style={{
                              left: highlight.position.x * scale,
                              top: highlight.position.y * scale,
                              width: highlight.position.width * scale,
                              height: highlight.position.height * scale,
                            }}
                            onClick={() => setSelectedHighlight(
                              selectedHighlight === highlight.content ? null : highlight.content
                            )}
                            title={`${highlight.type.toUpperCase()}: ${highlight.content}`}
                          />
                        ))}
                      </div>
                    </Document>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Text Content Viewer (for non-PDF documents) */}
            {!isPDF && content && (
              <Card>
                <CardHeader>
                  <CardTitle>Document Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="whitespace-pre-wrap text-sm p-4 bg-muted rounded-lg max-h-[600px] overflow-auto">
                      {content.content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={cn(
                      document.status === 'completed' && 'bg-green-100 text-green-800',
                      document.status === 'sensitive_detected' && 'bg-amber-100 text-amber-800',
                      document.status === 'processing' && 'bg-blue-100 text-blue-800',
                      document.status === 'error' && 'bg-red-100 text-red-800',
                    )}>
                      {document.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Size</label>
                  <p className="mt-1">{formatFileSize(document.size)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                  <p className="mt-1">{format(new Date(document.uploadedAt), 'MMM d, yyyy HH:mm')}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Uploaded By</label>
                  <p className="mt-1">{document.uploadedBy.name}</p>
                  <p className="text-sm text-muted-foreground">{document.uploadedBy.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Sensitive Data Summary */}
            {sensitiveData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.warning className="h-5 w-5 text-amber-500" />
                    Sensitive Data Detected
                  </CardTitle>
                  <CardDescription>
                    {sensitiveData.length} sensitive information item(s) found
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sensitiveData.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all',
                        selectedHighlight === item.content 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50',
                        sensitiveTypeColors[item.type]
                      )}
                      onClick={() => {
                        setSelectedHighlight(
                          selectedHighlight === item.content ? null : item.content
                        )
                        if (isPDF && item.position.page !== currentPage) {
                          setCurrentPage(item.position.page)
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {item.type.toUpperCase()}
                          </Badge>
                          <p className="text-sm font-medium">{item.content}</p>
                          <p className="text-xs text-muted-foreground">
                            Confidence: {Math.round(item.confidence * 100)}%
                          </p>
                        </div>
                        <Badge className={cn('text-xs', severityColors[item.severity])}>
                          {item.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/documents">
                    <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
                    Back to Documents
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/admin/permissions?document=${document.id}`}>
                      <Icons.user className="mr-2 h-4 w-4" />
                      Share Document
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

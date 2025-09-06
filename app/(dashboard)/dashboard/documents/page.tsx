'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGetDocumentsQuery, type DocumentFilters } from '@/lib/store/slices/documentsSlice'
import { useAuth } from '@/hooks/use-auth'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'

const statusColors = {
  uploading: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  sensitive_detected: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
}

const statusIcons = {
  uploading: 'spinner',
  processing: 'spinner',
  completed: 'check',
  error: 'warning',
  sensitive_detected: 'warning',
}

export default function DocumentsPage() {
  const { isAdmin } = useAuth()
  const searchParams = useSearchParams()
  const initialFilter = searchParams?.get('filter') || 'all'
  
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    status: initialFilter === 'sensitive' ? 'sensitive_detected' : undefined,
  })
  
  const { data: documents, isLoading, error } = useGetDocumentsQuery(filters)

  // Filter documents based on tab and filters
  const filteredDocuments = useMemo(() => {
    if (!documents) return []
    return documents.filter(doc => {
      if (filters.search && !doc.filename.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      return true
    })
  }, [documents, filters])

  const getFileIcon = (fileName: string) => {
    if (!fileName) return 'file'
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return 'file'
      case 'doc':
      case 'docx':
        return 'page'
      case 'txt':
        return 'post'
      default:
        return 'file'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTabCounts = () => {
    if (!documents) return { all: 0, sensitive: 0, processing: 0 }
    
    return {
      all: documents.length,
      sensitive: documents.filter(doc => doc.status === 'sensitive_detected').length,
      processing: documents.filter(doc => ['uploading', 'processing'].includes(doc.status)).length,
    }
  }

  const tabCounts = getTabCounts()

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Documents"
        description="Manage and review your uploaded documents"
        headerActions={
          <Button>
            <Link href="/dashboard/upload">
              <Icons.add className="mr-2 h-4 w-4" />
              Upload Document
            </Link>
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search documents..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => 
                      setFilters(prev => ({ 
                        ...prev, 
                        status: value === 'all' ? undefined : value as any 
                      }))
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="uploading">Uploading</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="sensitive_detected">Sensitive Data</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">
                All Documents
                {tabCounts.all > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {tabCounts.all}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sensitive">
                Sensitive Data
                {tabCounts.sensitive > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {tabCounts.sensitive}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="processing">
                Processing
                {tabCounts.processing > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {tabCounts.processing}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <DocumentTable 
                documents={filteredDocuments}
                isLoading={isLoading}
                isAdmin={isAdmin()}
              />
            </TabsContent>

            <TabsContent value="sensitive" className="space-y-4">
              <DocumentTable 
                documents={filteredDocuments.filter(doc => doc.status === 'sensitive_detected')}
                isLoading={isLoading}
                isAdmin={isAdmin()}
                showSensitiveInfo
              />
            </TabsContent>

            <TabsContent value="processing" className="space-y-4">
              <DocumentTable 
                documents={filteredDocuments.filter(doc => ['uploading', 'processing'].includes(doc.status))}
                isLoading={isLoading}
                isAdmin={isAdmin()}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function DocumentTable({ 
  documents, 
  isLoading, 
  isAdmin,
  showSensitiveInfo = false 
}: { 
  documents: any[]
  isLoading: boolean
  isAdmin: boolean
  showSensitiveInfo?: boolean
}) {
  const getFileIcon = (fileName: string) => {
    if (!fileName) return 'file'
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return 'file'
      case 'doc':
      case 'docx':
        return 'page'
      case 'txt':
        return 'post'
      default:
        return 'file'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Icons.spinner className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Icons.post className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
            <p className="text-muted-foreground">
              {showSensitiveInfo 
                ? "No documents with sensitive data detected." 
                : "No documents match your current filters."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            {showSensitiveInfo && <TableHead>Sensitive Data</TableHead>}
            {isAdmin && <TableHead>Uploaded By</TableHead>}
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => {
            const FileIcon = Icons[getFileIcon(document.originalname || document.filename) as keyof typeof Icons]
            const StatusIcon = Icons[statusIcons[document.status] as keyof typeof Icons]
            
            return (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{document.name}</p>
                      <p className="text-sm text-muted-foreground">{document.type}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={cn(
                      'inline-flex items-center',
                      statusColors[document.status]
                    )}
                  >
                    <StatusIcon 
                      className={cn(
                        'h-3 w-3 mr-1',
                        (document.status === 'uploading' || document.status === 'processing') && 'animate-spin'
                      )} 
                    />
                    {document.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatFileSize(document.size)}
                </TableCell>
                <TableCell>
                  {format(new Date(document.uploadedAt), 'MMM d, yyyy HH:mm')}
                </TableCell>
                {showSensitiveInfo && (
                  <TableCell>
                    {document.sensitiveData?.length > 0 && (
                      <div className="space-y-1">
                        {document.sensitiveData.map((data: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {data.type.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                )}
                {isAdmin && (
                  <TableCell>
                    <div className="text-sm">
                      <p>{document.uploadedBy.name}</p>
                      <p className="text-muted-foreground">{document.uploadedBy.email}</p>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Icons.ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/documents/${document.id}`}>
                          <Icons.eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      {(document.status === 'completed' || document.status === 'sensitive_detected') && (
                        <DropdownMenuItem>
                          <Icons.add className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/admin/permissions?document=${document.id}`}>
                              <Icons.user className="mr-2 h-4 w-4" />
                              Manage Access
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Icons.trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { useUploadDocumentMutation } from '@/lib/store/slices/documentsSlice'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface UploadedFile extends File {
  id: string
  uploadProgress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  errorMessage?: string
}

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substring(7),
      uploadProgress: 0,
      status: 'pending' as const,
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    
    // Start uploading each file
    newFiles.forEach(uploadFile)
  }, [])

  const uploadFile = async (file: UploadedFile) => {
    try {
      // Update file status to uploading
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id ? { ...f, status: 'uploading', uploadProgress: 0 } : f
        )
      )

      // Simulate upload progress (in real implementation, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id && f.uploadProgress < 90
              ? { ...f, uploadProgress: f.uploadProgress + 10 }
              : f
          )
        )
      }, 100)

      const result = await uploadDocument({ file }).unwrap()

      clearInterval(progressInterval)

      // Update file status to completed
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id
            ? { ...f, status: 'completed', uploadProgress: 100 }
            : f
        )
      )

      toast({
        title: 'Upload Successful',
        description: `${file.name} has been uploaded and is being processed.`,
      })

    } catch (error: any) {
      // Update file status to error
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id
            ? {
                ...f,
                status: 'error',
                uploadProgress: 0,
                errorMessage: error.message || 'Upload failed',
              }
            : f
        )
      )

      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${file.name}: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      })
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const retryUpload = (file: UploadedFile) => {
    uploadFile(file)
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  })

  const getFileIcon = (fileName: string) => {
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

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return 'spinner'
      case 'uploading':
        return 'spinner'
      case 'completed':
        return 'check'
      case 'error':
        return 'warning'
      default:
        return 'file'
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Upload Documents"
        description="Upload documents to scan for sensitive information"
        headerActions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/documents">
              <Icons.post className="mr-2 h-4 w-4" />
              View Documents
            </Link>
          </Button>
        }
      >
        <div className="space-y-8">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Drag and drop files here or click to browse. Supported formats: PDF, DOC, DOCX, TXT (max 50MB each)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : isDragReject
                    ? 'border-red-500 bg-red-50 dark:bg-red-950'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                  <Icons.add className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      {isDragActive
                        ? 'Drop files here'
                        : 'Drag and drop files here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or <span className="text-primary">click to browse</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, TXT files up to 50MB each
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Progress</CardTitle>
                <CardDescription>
                  Track the progress of your document uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((file) => {
                    const FileIcon = Icons[getFileIcon(file.name) as keyof typeof Icons]
                    const StatusIcon = Icons[getStatusIcon(file.status) as keyof typeof Icons]
                    
                    return (
                      <div
                        key={file.id}
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                      >
                        <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          
                          {file.status === 'uploading' && (
                            <div className="mt-2">
                              <Progress value={file.uploadProgress} className="w-full" />
                              <p className="text-xs text-muted-foreground mt-1">
                                {file.uploadProgress}% uploaded
                              </p>
                            </div>
                          )}
                          
                          {file.status === 'error' && file.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">
                              {file.errorMessage}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <StatusIcon
                            className={cn(
                              'h-5 w-5',
                              file.status === 'uploading' && 'animate-spin',
                              file.status === 'completed' && 'text-green-600',
                              file.status === 'error' && 'text-red-600'
                            )}
                          />
                          
                          {file.status === 'error' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryUpload(file)}
                            >
                              Retry
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(file.id)}
                          >
                            <Icons.close className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Supported File Types</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• PDF documents (.pdf)</li>
                    <li>• Microsoft Word documents (.doc, .docx)</li>
                    <li>• Plain text files (.txt)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Security Scanning</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All documents are automatically scanned for sensitive information</li>
                    <li>• Personal Identifiable Information (PII) detection</li>
                    <li>• Financial data identification</li>
                    <li>• Medical information recognition</li>
                    <li>• Confidential content flagging</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Processing Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Document processing typically takes 1-3 minutes depending on file size and content complexity.
                    You'll be notified when processing is complete.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

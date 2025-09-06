'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  useGetDocumentsQuery, 
  useShareDocumentMutation, 
  useUpdateDocumentPermissionsMutation,
  type Document 
} from '@/lib/store/slices/documentsSlice'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AdminRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface ShareDialogData {
  document: Document
  isOpen: boolean
}

interface UserSearchResult {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

// Mock user search function - in real app, this would be an API call
const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const mockUsers: UserSearchResult[] = [
    { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'user' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'user' },
    { id: '3', name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'admin' },
    { id: '4', name: 'Alice Brown', email: 'alice.brown@example.com', role: 'user' },
  ]
  
  return mockUsers.filter(user => 
    user.name.toLowerCase().includes(query.toLowerCase()) ||
    user.email.toLowerCase().includes(query.toLowerCase())
  )
}

export default function PermissionsManagementPage() {
  const searchParams = useSearchParams()
  const selectedDocumentId = searchParams?.get('document')
  
  const [shareDialog, setShareDialog] = useState<ShareDialogData>({ document: null as any, isOpen: false })
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedPermission, setSelectedPermission] = useState<'read' | 'write' | 'admin'>('read')
  const [isSearching, setIsSearching] = useState(false)
  
  const { data: documents, isLoading } = useGetDocumentsQuery({})
  const [shareDocument, { isLoading: isSharing }] = useShareDocumentMutation()
  const [updatePermissions, { isLoading: isUpdating }] = useUpdateDocumentPermissionsMutation()

  // Auto-select document if provided in URL
  useEffect(() => {
    if (selectedDocumentId && documents) {
      const document = documents.find(doc => doc.id === selectedDocumentId)
      if (document) {
        setShareDialog({ document, isOpen: true })
      }
    }
  }, [selectedDocumentId, documents])

  // Search users when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (userSearchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await searchUsers(userSearchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(performSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [userSearchQuery])

  const handleShareDocument = async () => {
    if (!shareDialog.document || selectedUsers.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one user to share with.',
        variant: 'destructive',
      })
      return
    }

    try {
      await shareDocument({
        documentId: shareDialog.document.id,
        userIds: selectedUsers,
        permission: selectedPermission,
      }).unwrap()

      toast({
        title: 'Document Shared',
        description: `Document "${shareDialog.document.name}" has been shared successfully.`,
      })

      // Reset state
      setShareDialog({ document: null as any, isOpen: false })
      setSelectedUsers([])
      setUserSearchQuery('')
      setSearchResults([])
    } catch (error: any) {
      toast({
        title: 'Sharing Failed',
        description: error.message || 'Failed to share document.',
        variant: 'destructive',
      })
    }
  }

  const handleRemovePermission = async (documentId: string, userId: string) => {
    const document = documents?.find(doc => doc.id === documentId)
    if (!document) return

    const updatedPermissions = document.sharedWith?.filter(perm => perm.userId !== userId) || []

    try {
      await updatePermissions({
        documentId,
        permissions: updatedPermissions,
      }).unwrap()

      toast({
        title: 'Permission Removed',
        description: 'User access has been revoked successfully.',
      })
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update permissions.',
        variant: 'destructive',
      })
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'write':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'read':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <AdminRoute>
        <DashboardLayout title="Loading...">
          <div className="flex items-center justify-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading permissions...</span>
          </div>
        </DashboardLayout>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <DashboardLayout
        title="Document Permissions"
        description="Manage document sharing and access permissions"
        headerActions={
          <Button onClick={() => setShareDialog({ document: null as any, isOpen: true })}>
            <Icons.user className="mr-2 h-4 w-4" />
            Share Document
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Documents with Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Document Access Management</CardTitle>
              <CardDescription>
                View and manage access permissions for all documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Shared With</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents?.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Icons.post className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{document.name}</p>
                            <p className="text-sm text-muted-foreground">{document.type}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{document.uploadedBy.name}</p>
                          <p className="text-sm text-muted-foreground">{document.uploadedBy.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {document.sharedWith?.length > 0 ? (
                            document.sharedWith.map((permission) => (
                              <div key={permission.userId} className="flex items-center space-x-2">
                                <span className="text-sm">{permission.userName}</span>
                                <Badge className={cn('text-xs', getPermissionBadgeColor(permission.permission))}>
                                  {permission.permission}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                  onClick={() => handleRemovePermission(document.id, permission.userId)}
                                >
                                  <Icons.close className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Not shared</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
                      </TableCell>
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
                            <DropdownMenuItem 
                              onClick={() => setShareDialog({ document, isOpen: true })}
                            >
                              <Icons.user className="mr-2 h-4 w-4" />
                              Share Document
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/dashboard/documents/${document.id}`}>
                                <Icons.eye className="mr-2 h-4 w-4" />
                                View Document
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Share Document Dialog */}
          <Dialog 
            open={shareDialog.isOpen} 
            onOpenChange={(open) => {
              if (!open) {
                setShareDialog({ document: null as any, isOpen: false })
                setSelectedUsers([])
                setUserSearchQuery('')
                setSearchResults([])
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Share Document</DialogTitle>
                <DialogDescription>
                  {shareDialog.document && (
                    <>Grant users access to "<strong>{shareDialog.document.name}</strong>"</>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* User Search */}
                <div className="space-y-2">
                  <Label htmlFor="user-search">Search Users</Label>
                  <Input
                    id="user-search"
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
                      Searching...
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Search Results</Label>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className={cn(
                            'flex items-center justify-between p-3 cursor-pointer hover:bg-accent',
                            selectedUsers.includes(user.id) && 'bg-accent'
                          )}
                          onClick={() => toggleUserSelection(user.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <Icons.user className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                              {user.role}
                            </Badge>
                            {selectedUsers.includes(user.id) && (
                              <Icons.check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Users ({selectedUsers.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((userId) => {
                        const user = searchResults.find(u => u.id === userId)
                        return (
                          <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                            {user?.name || userId}
                            <button
                              type="button"
                              onClick={() => toggleUserSelection(userId)}
                              className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                            >
                              <Icons.close className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Permission Level */}
                <div className="space-y-2">
                  <Label htmlFor="permission-select">Permission Level</Label>
                  <Select value={selectedPermission} onValueChange={(value: any) => setSelectedPermission(value)}>
                    <SelectTrigger id="permission-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read Only - Can view document</SelectItem>
                      <SelectItem value="write">Read & Write - Can view and download</SelectItem>
                      <SelectItem value="admin">Admin - Full access including sharing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShareDialog({ document: null as any, isOpen: false })}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleShareDocument}
                  disabled={selectedUsers.length === 0 || isSharing}
                >
                  {isSharing && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Share Document
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </AdminRoute>
  )
}

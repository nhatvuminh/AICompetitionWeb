'use client'

import { useState } from 'react'
import { useGetStatsQuery, useGetActivityLogsQuery, useExportReportMutation } from '@/lib/store/slices/reportsSlice'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AdminRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { format, subDays, subMonths } from 'date-fns'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const dateRangeOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
]

const sensitiveDataColors = {
  pii: '#3B82F6',
  financial: '#10B981',
  medical: '#EF4444',
  confidential: '#F59E0B',
}

const statusColors = {
  uploading: '#6B7280',
  processing: '#3B82F6',
  completed: '#10B981',
  error: '#EF4444',
  sensitive_detected: '#F59E0B',
}

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [isExporting, setIsExporting] = useState(false)

  // Calculate date range
  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case '7d':
        return { dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') }
      case '30d':
        return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') }
      case '90d':
        return { dateFrom: format(subDays(now, 90), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') }
      case '1y':
        return { dateFrom: format(subMonths(now, 12), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') }
      default:
        return { dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') }
    }
  }

  const { data: stats, isLoading: statsLoading } = useGetStatsQuery(getDateRange())
  const { data: activityData, isLoading: activityLoading } = useGetActivityLogsQuery({
    ...getDateRange(),
    limit: 100
  })
  
  const [exportReport] = useExportReportMutation()

  const handleExportReport = async (type: 'stats' | 'activity', format: 'pdf' | 'csv') => {
    setIsExporting(true)
    try {
      const blob = await exportReport({
        type,
        filters: getDateRange(),
        format,
      }).unwrap()

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${dateRange}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Successful',
        description: `${type} report has been downloaded.`,
      })
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export report.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Prepare chart data
  const sensitiveDataChartData = stats ? Object.entries(stats.sensitiveDataByType).map(([type, count]) => ({
    name: type.toUpperCase(),
    value: count,
    color: sensitiveDataColors[type as keyof typeof sensitiveDataColors],
  })) : []

  const statusChartData = stats ? Object.entries(stats.documentsByStatus).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count,
    color: statusColors[status as keyof typeof statusColors],
  })) : []

  const uploadTrendsData = stats?.uploadTrends || []

  if (statsLoading) {
    return (
      <AdminRoute>
        <DashboardLayout title="Loading Reports...">
          <div className="flex items-center justify-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading reports...</span>
          </div>
        </DashboardLayout>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <DashboardLayout
        title="Analytics & Reports"
        description="System statistics and comprehensive reporting"
        headerActions={
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => handleExportReport('stats', 'pdf')}
              disabled={isExporting}
            >
              {isExporting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              <Icons.billing className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <Icons.post className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.uploadsThisMonth || 0} uploaded this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sensitive Data Detected</CardTitle>
                <Icons.warning className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {stats?.documentsWithSensitiveData || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalDocuments > 0 
                    ? `${Math.round((stats.documentsWithSensitiveData / stats.totalDocuments) * 100)}% of total`
                    : '0% of total'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Icons.user className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  System users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Icons.add className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.uploadsThisMonth || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Documents uploaded
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upload Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Trends</CardTitle>
                <CardDescription>Document uploads and sensitive data detection over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={uploadTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="uploads" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.3}
                        name="Total Uploads"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sensitiveDetected" 
                        stroke="#F59E0B" 
                        fill="#F59E0B" 
                        fillOpacity={0.3}
                        name="Sensitive Data Detected"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Document Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Document Status Distribution</CardTitle>
                <CardDescription>Current status of all documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sensitive Data Types */}
          <Card>
            <CardHeader>
              <CardTitle>Sensitive Data by Type</CardTitle>
              <CardDescription>Breakdown of detected sensitive information types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sensitiveDataChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6">
                      {sensitiveDataChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Reports */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="users">Top Users</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity Log</CardTitle>
                  <CardDescription>Latest user actions and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  {activityLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Icons.spinner className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading activity...</span>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>IP Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityData?.logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{log.userName}</p>
                                <p className="text-sm text-muted-foreground">{log.userEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {log.action.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {log.documentName && (
                                <div>
                                  <p className="font-medium">{log.documentName}</p>
                                  <p className="text-xs text-muted-foreground">{log.details}</p>
                                </div>
                              )}
                              {!log.documentName && (
                                <span className="text-sm text-muted-foreground">{log.details}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <code className="text-sm">{log.ipAddress}</code>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Users</CardTitle>
                  <CardDescription>Most active users by document uploads and sensitive data</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Sensitive Data Items</TableHead>
                        <TableHead>Risk Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.topUsers.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.userName}</p>
                              <p className="text-sm text-muted-foreground">{user.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-lg font-semibold">{user.documentCount}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-lg font-semibold text-amber-600">
                              {user.sensitiveDataCount}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={cn(
                                user.sensitiveDataCount === 0 && 'bg-green-100 text-green-800',
                                user.sensitiveDataCount > 0 && user.sensitiveDataCount <= 5 && 'bg-yellow-100 text-yellow-800',
                                user.sensitiveDataCount > 5 && 'bg-red-100 text-red-800'
                              )}
                            >
                              {user.sensitiveDataCount === 0 && 'Low'}
                              {user.sensitiveDataCount > 0 && user.sensitiveDataCount <= 5 && 'Medium'}
                              {user.sensitiveDataCount > 5 && 'High'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AdminRoute>
  )
}

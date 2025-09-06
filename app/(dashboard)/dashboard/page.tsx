'use client'

import { useAuth } from "@/hooks/use-auth"
import { useGetStatsQuery } from "@/lib/store/slices/reportsSlice"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import Link from "next/link"

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const { data: stats, isLoading, error } = useGetStatsQuery({})

  const quickStats = [
    {
      title: "Total Documents",
      value: stats?.totalDocuments || 0,
      icon: "post",
      description: "Documents in your account"
    },
    {
      title: "Sensitive Data Found",
      value: stats?.documentsWithSensitiveData || 0,
      icon: "warning",
      description: "Documents flagged for review"
    },
    {
      title: "Uploads This Month",
      value: stats?.uploadsThisMonth || 0,
      icon: "add",
      description: "Recent document uploads"
    },
    {
      title: "Active Users",
      value: stats?.totalUsers || 0,
      icon: "user",
      description: "Users in the system",
      adminOnly: true
    }
  ]

  const filteredStats = quickStats.filter(stat => !stat.adminOnly || isAdmin())

  return (
    <ProtectedRoute>
      <DashboardLayout
        title="Dashboard"
        description="Welcome to the Document Security Portal"
        headerActions={
          <Button>
            <Link href="/dashboard/upload">
              <Icons.add className="mr-2 h-4 w-4" />
              Upload Document
            </Link>
          </Button>
        }
      >
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col space-y-2">
            <h2 className="text-2xl font-bold">Welcome back, {user?.name}!</h2>
            <p className="text-muted-foreground">
              Here's an overview of your document security status.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredStats.map((stat) => {
              const Icon = Icons[stat.icon as keyof typeof Icons]
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoading ? "..." : stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.add className="h-5 w-5" />
                    Upload New Document
                  </CardTitle>
                  <CardDescription>
                    Add a new document to scan for sensitive information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Link href="/dashboard/upload">Upload Now</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.post className="h-5 w-5" />
                    View Documents
                  </CardTitle>
                  <CardDescription>
                    Browse and manage your uploaded documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    <Link href="/dashboard/documents">View All</Link>
                  </Button>
                </CardContent>
              </Card>

              {isAdmin() && (
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.billing className="h-5 w-5" />
                      Admin Reports
                    </CardTitle>
                    <CardDescription>
                      View comprehensive system reports and analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <Link href="/dashboard/admin/reports">View Reports</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Activity or Warnings */}
          {stats?.documentsWithSensitiveData && stats.documentsWithSensitiveData > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Icons.warning className="h-5 w-5" />
                  Security Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-700 dark:text-amber-300">
                  You have {stats.documentsWithSensitiveData} document(s) with detected sensitive information that may require attention.
                </p>
                <Button variant="outline" className="mt-3">
                  <Link href="/dashboard/documents?filter=sensitive">
                    Review Documents
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
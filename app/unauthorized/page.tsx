import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.warning className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Access Denied
          </h1>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "default" })}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost" })}
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

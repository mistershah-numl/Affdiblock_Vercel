import type { ReactNode } from "react"
import { BackButton } from "@/components/back-button"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  showBackButton?: boolean
}

export function PageHeader({ title, description, children, showBackButton = false }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="flex items-start gap-2">
        {showBackButton && <BackButton />}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

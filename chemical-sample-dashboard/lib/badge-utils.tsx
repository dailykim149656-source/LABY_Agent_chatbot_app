"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = "success" | "warning" | "error" | "info" | "default"

const STATUS_STYLES: Record<StatusType, string> = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  error: "bg-destructive text-destructive-foreground",
  info: "bg-primary text-primary-foreground",
  default: "bg-secondary text-secondary-foreground",
}

interface StatusBadgeProps {
  label: string
  type?: StatusType
  className?: string
}

export function StatusBadge({ label, type = "default", className }: StatusBadgeProps) {
  return <Badge className={cn(STATUS_STYLES[type], className)}>{label}</Badge>
}

// Common status to type mappings
export const STATUS_TYPE_MAP: Record<string, StatusType> = {
  // Completion statuses
  completed: "success",
  delivered: "success",
  resolved: "success",
  // Progress statuses
  in_progress: "info",
  acknowledged: "warning",
  pending: "warning",
  active: "warning",
  // Error statuses
  failed: "error",
  critical: "error",
  false_alarm: "default",
}

export function getStatusType(status: string): StatusType {
  return STATUS_TYPE_MAP[status] || "default"
}

// Severity utilities
export type SeverityLevel = "critical" | "high" | "medium" | "low"

const SEVERITY_STYLES: Record<SeverityLevel, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive/80 text-destructive-foreground",
  medium: "bg-warning text-warning-foreground",
  low: "bg-secondary text-secondary-foreground",
}

interface SeverityBadgeProps {
  severity: SeverityLevel
  label: string
  className?: string
}

export function SeverityBadge({ severity, label, className }: SeverityBadgeProps) {
  return <Badge className={cn(SEVERITY_STYLES[severity], className)}>{label}</Badge>
}

export function getSeverityStyle(severity: SeverityLevel): string {
  return SEVERITY_STYLES[severity] || SEVERITY_STYLES.low
}

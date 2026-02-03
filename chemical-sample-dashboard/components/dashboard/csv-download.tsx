"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUiText } from "@/lib/ui-text"
import { API_BASE_URL } from "@/lib/api"

type LogType = "conversations" | "accidents" | "experiments"
type DownloadRange = "1000" | "all"

interface CsvDownloadProps {
  language: string
}

export function CsvDownload({ language }: CsvDownloadProps) {
  const uiText = getUiText(language)
  const [logType, setLogType] = useState<LogType>("conversations")
  const [downloadRange, setDownloadRange] = useState<DownloadRange>("1000")
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const url = `${API_BASE_URL}/api/export/${logType}?limit=${downloadRange}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `${logType}_export.csv`

      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/)
        if (match) {
          filename = match[1]
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Download error:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">{uiText.csvDownloadTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">{uiText.csvDownloadLogType}</Label>
          <RadioGroup
            value={logType}
            onValueChange={(value) => setLogType(value as LogType)}
            className="grid gap-2"
          >
            <div className="flex items-center space-x-3 rounded-md border border-border/50 p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="conversations" id="log-conversations" />
              <Label htmlFor="log-conversations" className="flex-1 cursor-pointer">
                {uiText.csvDownloadLogConversation}
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-md border border-border/50 p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="accidents" id="log-accidents" />
              <Label htmlFor="log-accidents" className="flex-1 cursor-pointer">
                {uiText.csvDownloadLogAccident}
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-md border border-border/50 p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="experiments" id="log-experiments" />
              <Label htmlFor="log-experiments" className="flex-1 cursor-pointer">
                {uiText.csvDownloadLogExperiment}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">{uiText.csvDownloadRange}</Label>
          <RadioGroup
            value={downloadRange}
            onValueChange={(value) => setDownloadRange(value as DownloadRange)}
            className="grid gap-2"
          >
            <div className="flex items-center space-x-3 rounded-md border border-border/50 p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="1000" id="range-1000" />
              <Label htmlFor="range-1000" className="flex-1 cursor-pointer">
                {uiText.csvDownloadRecent1000}
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-md border border-border/50 p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="all" id="range-all" />
              <Label htmlFor="range-all" className="flex-1 cursor-pointer">
                {uiText.csvDownloadAll}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full gap-2"
        >
          <Download className="size-4" />
          {isDownloading ? uiText.loading : uiText.csvDownloadButton}
        </Button>
      </CardContent>
    </Card>
  )
}

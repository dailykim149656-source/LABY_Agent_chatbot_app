"use client"

import { FileText, AlertCircle, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConversationLogs } from "./conversation-logs"
import { AccidentStatus } from "./accident-status"
import { CsvDownload } from "./csv-download"
import { getUiText } from "@/lib/ui-text"

interface AccidentConfirmationProps {
  language: string
}

export function AccidentConfirmation({ language }: AccidentConfirmationProps) {
  const uiText = getUiText(language)

  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <Tabs defaultValue="accident-status" className="flex-1">
        <TabsList className="mb-4 w-fit flex-wrap">
          <TabsTrigger value="conversation-logs" className="gap-2">
            <FileText className="size-4" />
            {uiText.accidentTabConversation}
          </TabsTrigger>
          <TabsTrigger value="accident-status" className="gap-2">
            <AlertCircle className="size-4" />
            {uiText.accidentTabStatus}
          </TabsTrigger>
          <TabsTrigger value="csv-download" className="gap-2">
            <Download className="size-4" />
            {uiText.csvTabDownload}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation-logs" className="mt-0 flex-1">
          <ConversationLogs language={language} />
        </TabsContent>

        <TabsContent value="accident-status" className="mt-0 flex-1">
          <AccidentStatus language={language} />
        </TabsContent>

        <TabsContent value="csv-download" className="mt-0 flex-1">
          <CsvDownload language={language} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

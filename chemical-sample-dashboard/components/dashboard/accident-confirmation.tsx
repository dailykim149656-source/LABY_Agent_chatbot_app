"use client"

import { FileText, Mail, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConversationLogs } from "./conversation-logs"
import { EmailLogs } from "./email-logs"
import { AccidentStatus } from "./accident-status"

export function AccidentConfirmation() {
  return (
    <div className="flex h-full flex-col p-6">
      <Tabs defaultValue="accident-status" className="flex-1">
        <TabsList className="mb-4 w-fit">
          <TabsTrigger value="conversation-logs" className="gap-2">
            <FileText className="size-4" />
            대화 로그
          </TabsTrigger>
          <TabsTrigger value="email-logs" className="gap-2">
            <Mail className="size-4" />
            이메일 로그
          </TabsTrigger>
          <TabsTrigger value="accident-status" className="gap-2">
            <AlertCircle className="size-4" />
            사고 상태
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation-logs" className="mt-0 flex-1">
          <ConversationLogs />
        </TabsContent>

        <TabsContent value="email-logs" className="mt-0 flex-1">
          <EmailLogs />
        </TabsContent>

        <TabsContent value="accident-status" className="mt-0 flex-1">
          <AccidentStatus />
        </TabsContent>
      </Tabs>
    </div>
  )
}

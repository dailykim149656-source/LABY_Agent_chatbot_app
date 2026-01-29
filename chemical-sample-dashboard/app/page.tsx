"use client"

import { useState } from "react"
import { DashboardSidebar, type TabType } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { ChatInterface } from "@/components/dashboard/chat-interface"
import { SafetyStatus } from "@/components/dashboard/safety-status"
import { AccidentConfirmation } from "@/components/dashboard/accident-confirmation"
import { MonitoringView } from "@/components/dashboard/monitoring-view"
import { ExperimentsView } from "@/components/dashboard/experiments-view"
import { ReagentsView } from "@/components/dashboard/reagents-view"
import { useChatData } from "@/hooks/use-chat"
import { getUiText } from "@/lib/ui-text"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("chatbot")
  const [language, setLanguage] = useState("KR")
  const uiText = getUiText(language)
  const {
    rooms,
    activeRoomId,
    setActiveRoomId,
    messages,
    isLoadingRooms,
    isLoadingMessages,
    isSending,
    createRoom,
    sendMessage,
    renameRoom,
    deleteRoom,
  } = useChatData(uiText.newChat)

  const handleNewChat = async () => {
    try {
      await createRoom()
    } catch {
      // ignore
    }
  }

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId)
  }

  const handleRenameRoom = async (roomId: string, title: string) => {
    try {
      await renameRoom(roomId, title)
    } catch {
      // ignore
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId)
    } catch {
      // ignore
    }
  }

  const titleByTab: Record<TabType, string> = {
    chatbot: uiText.titleChatbot,
    monitoring: uiText.titleMonitoring,
    experiments: uiText.titleExperiments,
    reagents: uiText.titleReagents,
    accident: uiText.titleAccident,
  }
  const pageTitle = titleByTab[activeTab] ?? uiText.titleDefault

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewChat={handleNewChat}
        language={language}
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={handleSelectRoom}
        isRoomsLoading={isLoadingRooms}
        onRenameRoom={handleRenameRoom}
        onDeleteRoom={handleDeleteRoom}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          title={pageTitle}
          language={language}
          onLanguageChange={setLanguage}
        />

        <main className="flex-1 overflow-hidden">
          {activeTab === "chatbot" && (
            <div className="grid h-full grid-cols-[1fr_460px]">
              <div className="flex h-full flex-col overflow-hidden border-r border-border">
                <ChatInterface
                  language={language}
                  roomId={activeRoomId}
                  messages={messages}
                  isLoading={isLoadingMessages}
                  isSending={isSending}
                  onSend={sendMessage}
                />
              </div>
              <div className="h-full overflow-y-auto">
                <SafetyStatus language={language} />
              </div>
            </div>
          )}

          {activeTab === "monitoring" && <MonitoringView />}

          {activeTab === "experiments" && <ExperimentsView />}

          {activeTab === "reagents" && <ReagentsView />}

          {activeTab === "accident" && <AccidentConfirmation />}
        </main>
      </div>
    </div>
  )
}

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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("chatbot")
  const [language, setLanguage] = useState("KR")
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
  } = useChatData()

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

  const getTitle = () => {
    switch (activeTab) {
      case "chatbot":
        return "화학 시료 관리 어시스턴트"
      case "monitoring":
        return "실시간 모니터링"
      case "experiments":
        return "실험 관리"
      case "reagents":
        return "시약 관리"
      case "accident":
        return "사고 확인 및 모니터링"
      default:
        return "대시보드"
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewChat={handleNewChat}
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={handleSelectRoom}
        isRoomsLoading={isLoadingRooms}
        onRenameRoom={handleRenameRoom}
        onDeleteRoom={handleDeleteRoom}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          title={getTitle()}
          language={language}
          onLanguageChange={setLanguage}
        />

        <main className="flex-1 overflow-hidden">
          {activeTab === "chatbot" && (
            <div className="grid h-full grid-cols-[1fr_460px]">
              <div className="flex h-full flex-col overflow-hidden border-r border-border">
                <ChatInterface
                  roomId={activeRoomId}
                  messages={messages}
                  isLoading={isLoadingMessages}
                  isSending={isSending}
                  onSend={sendMessage}
                />
              </div>
              <div className="h-full overflow-y-auto">
                <SafetyStatus />
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

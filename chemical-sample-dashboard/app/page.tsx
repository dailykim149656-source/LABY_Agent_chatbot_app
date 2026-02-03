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
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useChatData } from "@/hooks/use-chat"
import { getUiText } from "@/lib/ui-text"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("chatbot")
  const [language, setLanguage] = useState("KR")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileChatOpen, setMobileChatOpen] = useState(true)
  const [mobileStatusOpen, setMobileStatusOpen] = useState(true)
  const uiText = getUiText(language)
  const chatToggleLabel = uiText.mobileToggleChat
  const statusToggleLabel = uiText.mobileToggleStatus
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
  } = useChatData(uiText.newChat, language)

  const handleNewChat = async () => {
    try {
      await createRoom()
    } catch {
      // ignore
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId)
    setSidebarOpen(false)
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
    <div className="flex h-screen min-w-[360px] bg-background">
      <div className="hidden lg:flex">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onNewChat={handleNewChat}
          language={language}
          onLanguageChange={setLanguage}
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={handleSelectRoom}
          isRoomsLoading={isLoadingRooms}
          onRenameRoom={handleRenameRoom}
          onDeleteRoom={handleDeleteRoom}
        />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-72">
          <DashboardSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onNewChat={handleNewChat}
            language={language}
            onLanguageChange={setLanguage}
            rooms={rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectRoom}
            isRoomsLoading={isLoadingRooms}
            onRenameRoom={handleRenameRoom}
            onDeleteRoom={handleDeleteRoom}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          title={pageTitle}
          language={language}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-auto lg:overflow-hidden">
          {activeTab === "chatbot" && (
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2 lg:hidden">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 justify-center text-xs",
                    mobileChatOpen ? "bg-secondary text-foreground" : "text-muted-foreground"
                  )}
                  aria-pressed={mobileChatOpen}
                  onClick={() => setMobileChatOpen((prev) => !prev)}
                >
                  {chatToggleLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 justify-center text-xs",
                    mobileStatusOpen ? "bg-secondary text-foreground" : "text-muted-foreground"
                  )}
                  aria-pressed={mobileStatusOpen}
                  onClick={() => setMobileStatusOpen((prev) => !prev)}
                >
                  {statusToggleLabel}
                </Button>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_460px]">
                <div
                  className={cn(
                    "flex h-full min-h-0 flex-col overflow-hidden border-b border-border lg:border-b-0 lg:border-r",
                    !mobileChatOpen && "hidden lg:flex"
                  )}
                >
                  <ChatInterface
                    language={language}
                    roomId={activeRoomId}
                    messages={messages}
                    isLoading={isLoadingMessages}
                    isSending={isSending}
                    onSend={sendMessage}
                  />
                </div>
                <div
                  className={cn(
                    "h-full min-h-0 overflow-y-auto",
                    !mobileStatusOpen && "hidden lg:block"
                  )}
                >
                  <SafetyStatus language={language} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "monitoring" && <MonitoringView />}

          {activeTab === "experiments" && (
            <div className="h-full">
              <ExperimentsView language={language} />
            </div>
          )}

          {activeTab === "reagents" && (
            <div className="h-full">
              <ReagentsView language={language} />
            </div>
          )}

          {activeTab === "accident" && <AccidentConfirmation language={language} />}
        </main>
      </div>
    </div>
  )
}

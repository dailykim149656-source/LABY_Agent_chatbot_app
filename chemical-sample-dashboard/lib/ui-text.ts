export const DEFAULT_UI_LANG = "KR" as const

export type UiLang = "KR" | "EN" | "JP" | "CN"

type UiText = {
  titleChatbot: string
  titleMonitoring: string
  titleExperiments: string
  titleReagents: string
  titleAccident: string
  titleDefault: string
  labDashboard: string
  newChat: string
  recentChats: string
  loading: string
  noChats: string
  renameChatPrompt: string
  deleteChatConfirm: string
  renameChatLabel: string
  deleteChatLabel: string
  tabChatbot: string
  tabMonitoring: string
  tabExperiments: string
  tabReagents: string
  tabAccidents: string
  systemNormal: string
  chatEmpty: string
  chatLoading: string
  chatPlaceholder: string
  send: string
  userName: string
  userRole: string
  envStatusTitle: string
  envTemperature: string
  envHumidity: string
  envVentilation: string
  envAirQuality: string
  envVentilationValue: string
  envAirQualityValue: string
  alertsTitle: string
  alertsEmpty: string
  alertLabelEventId: string
  alertLabelTime: string
  alertLabelLocation: string
  alertLabelStatus: string
  alertLabelVerificationStatus: string
  alertLabelExperimentId: string
  paginationSummary: string
  paginationPrev: string
  paginationNext: string
  systemStatusTitle: string
  systemStatusSubtitle: string
  systemStatusBadge: string
}

const UI_STRINGS: Record<UiLang, UiText> = {
  KR: {
    titleChatbot: "화학 샘플 관리 시스템",
    titleMonitoring: "실시간 모니터링",
    titleExperiments: "실험 관리",
    titleReagents: "시약 관리",
    titleAccident: "사고 확인 및 모니터링",
    titleDefault: "대시보드",
    labDashboard: "실험실 대시보드",
    newChat: "새 채팅",
    recentChats: "최근 대화",
    loading: "불러오는 중...",
    noChats: "대화가 없습니다.",
    renameChatPrompt: "채팅 이름 변경",
    deleteChatConfirm: "채팅을 삭제할까요? \"{title}\"",
    renameChatLabel: "채팅 이름 변경",
    deleteChatLabel: "채팅 삭제",
    tabChatbot: "챗봇",
    tabMonitoring: "모니터링",
    tabExperiments: "실험",
    tabReagents: "시약",
    tabAccidents: "사고",
    systemNormal: "시스템 정상",
    chatEmpty: "채팅방을 선택하거나 새로 시작하세요.",
    chatLoading: "메시지를 불러오는 중...",
    chatPlaceholder: "시약, 실험, 안전 프로토콜을 물어보세요...",
    send: "전송",
    userName: "연구원",
    userRole: "관리자",
    envStatusTitle: "환경 상태",
    envTemperature: "온도",
    envHumidity: "습도",
    envVentilation: "환기",
    envAirQuality: "공기질",
    envVentilationValue: "가동 중",
    envAirQualityValue: "양호",
    alertsTitle: "활성 알림",
    alertsEmpty: "활성 알림이 없습니다",
    alertLabelEventId: "이벤트 ID",
    alertLabelTime: "시간",
    alertLabelLocation: "위치",
    alertLabelStatus: "상태",
    alertLabelVerificationStatus: "검증 상태",
    alertLabelExperimentId: "실험 ID",
    paginationSummary: "페이지 {page} / {total} · 총 {count}",
    paginationPrev: "이전",
    paginationNext: "다음",
    systemStatusTitle: "시스템 상태",
    systemStatusSubtitle: "모든 시스템이 정상 작동 중입니다.",
    systemStatusBadge: "정상",
  },
  EN: {
    titleChatbot: "Chemical Sample Management",
    titleMonitoring: "Real-time Monitoring",
    titleExperiments: "Experiments",
    titleReagents: "Reagents",
    titleAccident: "Accident Confirmation & Monitoring",
    titleDefault: "Dashboard",
    labDashboard: "Lab Dashboard",
    newChat: "New Chat",
    recentChats: "Recent Chats",
    loading: "Loading...",
    noChats: "No chats yet.",
    renameChatPrompt: "Rename chat",
    deleteChatConfirm: "Delete chat \"{title}\"?",
    renameChatLabel: "Rename chat",
    deleteChatLabel: "Delete chat",
    tabChatbot: "Chatbot",
    tabMonitoring: "Monitoring",
    tabExperiments: "Experiments",
    tabReagents: "Reagents",
    tabAccidents: "Accidents",
    systemNormal: "System Normal",
    chatEmpty: "Select a chat room or start a new one to begin.",
    chatLoading: "Loading messages...",
    chatPlaceholder: "Ask about chemical samples or safety protocols...",
    send: "Send",
    userName: "Researcher",
    userRole: "Administrator",
    envStatusTitle: "Environment Status",
    envTemperature: "Temperature",
    envHumidity: "Humidity",
    envVentilation: "Ventilation",
    envAirQuality: "Air Quality",
    envVentilationValue: "Active",
    envAirQualityValue: "Good",
    alertsTitle: "Active Alerts",
    alertsEmpty: "No active alerts",
    alertLabelEventId: "Event ID",
    alertLabelTime: "Time",
    alertLabelLocation: "Location",
    alertLabelStatus: "Status",
    alertLabelVerificationStatus: "Verification Status",
    alertLabelExperimentId: "Experiment ID",
    paginationSummary: "Page {page} / {total} · Total {count}",
    paginationPrev: "Prev",
    paginationNext: "Next",
    systemStatusTitle: "System Status",
    systemStatusSubtitle: "All systems operating normally.",
    systemStatusBadge: "Normal",
  },
  JP: {
    titleChatbot: "化学サンプル管理",
    titleMonitoring: "リアルタイム監視",
    titleExperiments: "実験管理",
    titleReagents: "試薬管理",
    titleAccident: "事故確認・監視",
    titleDefault: "ダッシュボード",
    labDashboard: "ラボダッシュボード",
    newChat: "新しいチャット",
    recentChats: "最近のチャット",
    loading: "読み込み中...",
    noChats: "まだチャットはありません。",
    renameChatPrompt: "チャット名を変更",
    deleteChatConfirm: "チャット \"{title}\" を削除しますか？",
    renameChatLabel: "チャット名を変更",
    deleteChatLabel: "チャットを削除",
    tabChatbot: "チャットボット",
    tabMonitoring: "監視",
    tabExperiments: "実験",
    tabReagents: "試薬",
    tabAccidents: "事故",
    systemNormal: "システム正常",
    chatEmpty: "チャットルームを選ぶか新規作成してください。",
    chatLoading: "メッセージを読み込み中...",
    chatPlaceholder: "試薬・実験・安全プロトコルについて質問してください...",
    send: "送信",
    userName: "研究員",
    userRole: "管理者",
    envStatusTitle: "環境状態",
    envTemperature: "温度",
    envHumidity: "湿度",
    envVentilation: "換気",
    envAirQuality: "空気質",
    envVentilationValue: "稼働中",
    envAirQualityValue: "良好",
    alertsTitle: "アクティブアラート",
    alertsEmpty: "アクティブなアラートはありません",
    alertLabelEventId: "イベントID",
    alertLabelTime: "時間",
    alertLabelLocation: "場所",
    alertLabelStatus: "状態",
    alertLabelVerificationStatus: "検証状態",
    alertLabelExperimentId: "実験ID",
    paginationSummary: "ページ {page} / {total} ・ 合計 {count}",
    paginationPrev: "前へ",
    paginationNext: "次へ",
    systemStatusTitle: "システム状態",
    systemStatusSubtitle: "すべてのシステムは正常に動作しています。",
    systemStatusBadge: "正常",
  },
  CN: {
    titleChatbot: "化学样品管理",
    titleMonitoring: "实时监控",
    titleExperiments: "实验管理",
    titleReagents: "试剂管理",
    titleAccident: "事故确认与监控",
    titleDefault: "仪表板",
    labDashboard: "实验室仪表板",
    newChat: "新建聊天",
    recentChats: "最近聊天",
    loading: "加载中...",
    noChats: "暂无聊天。",
    renameChatPrompt: "重命名聊天",
    deleteChatConfirm: "确定删除聊天\"{title}\"吗？",
    renameChatLabel: "重命名聊天",
    deleteChatLabel: "删除聊天",
    tabChatbot: "聊天机器人",
    tabMonitoring: "监控",
    tabExperiments: "实验",
    tabReagents: "试剂",
    tabAccidents: "事故",
    systemNormal: "系统正常",
    chatEmpty: "请选择一个聊天室或新建开始。",
    chatLoading: "正在加载消息...",
    chatPlaceholder: "咨询化学样品或安全规程...",
    send: "发送",
    userName: "研究员",
    userRole: "管理员",
    envStatusTitle: "环境状态",
    envTemperature: "温度",
    envHumidity: "湿度",
    envVentilation: "通风",
    envAirQuality: "空气质量",
    envVentilationValue: "运行中",
    envAirQualityValue: "良好",
    alertsTitle: "活动警报",
    alertsEmpty: "暂无活动警报",
    alertLabelEventId: "事件 ID",
    alertLabelTime: "时间",
    alertLabelLocation: "位置",
    alertLabelStatus: "状态",
    alertLabelVerificationStatus: "验证状态",
    alertLabelExperimentId: "实验 ID",
    paginationSummary: "第 {page} / {total} 页 · 共 {count}",
    paginationPrev: "上一页",
    paginationNext: "下一页",
    systemStatusTitle: "系统状态",
    systemStatusSubtitle: "所有系统运行正常。",
    systemStatusBadge: "正常",
  },
}

const UI_LOCALES: Record<UiLang, string> = {
  KR: "ko-KR",
  EN: "en-US",
  JP: "ja-JP",
  CN: "zh-CN",
}

export const LANGUAGE_OPTIONS: Array<{ code: UiLang; label: string }> = [
  { code: "KR", label: "한국어" },
  { code: "EN", label: "English" },
  { code: "JP", label: "日本語" },
  { code: "CN", label: "中文" },
]

export function normalizeUiLang(lang?: string | null): UiLang {
  const key = (lang ?? DEFAULT_UI_LANG).trim().toUpperCase()
  if (key === "KR" || key === "EN" || key === "JP" || key === "CN") {
    return key as UiLang
  }
  return DEFAULT_UI_LANG
}

export function getUiText(lang?: string | null): UiText {
  return UI_STRINGS[normalizeUiLang(lang)]
}

export function getUiLocale(lang?: string | null): string {
  return UI_LOCALES[normalizeUiLang(lang)]
}

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
  mobileToggleChat: string
  mobileToggleStatus: string
  systemNormal: string
  chatEmpty: string
  chatLoading: string
  chatPlaceholder: string
  send: string
  voiceListening: string
  voiceStart: string
  voiceStop: string
  voiceNotSupported: string
  voiceWakeWordHint: string
  userName: string
  userRole: string
  envStatusTitle: string
  envTemperature: string
  envHumidity: string
  envVentilation: string
  envAirQuality: string
  envVentilationValue: string
  envAirQualityValue: string
  envCamera: string
  envScale: string
  envCameraValue: string
  envScaleValue: string
  envDisconnectedValue: string
  envNoDevices: string
  envTimestampLabel: string
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
  actionCancel: string
  actionAdd: string
  actionSave: string
  actionEdit: string
  actionRefresh: string
  updatedAtLabel: string
  actionCollapse: string
  actionExpand: string
  experimentsListTitle: string
  experimentsNewButton: string
  experimentsDialogTitle: string
  experimentsDialogDescription: string
  experimentsLabelTitle: string
  experimentsLabelResearcher: string
  experimentsReagentsTitle: string
  experimentsAddReagentButton: string
  experimentsAddReagentTitle: string
  experimentsAddReagentDescription: string
  experimentsReagentSelectLabel: string
  experimentsReagentSearchEmpty: string
  experimentsReagentAvailableHeading: string
  experimentsLabelLocation: string
  experimentsLabelStock: string
  experimentsLabelPurity: string
  experimentsLabelDosage: string
  experimentsReagentDosageLabel: string
  experimentsLabelCurrentVolume: string
  experimentsLabelDensity: string
  experimentsLabelMass: string
  experimentsLabelReagentId: string
  experimentsMemoTitle: string
  experimentsMemoSave: string
  experimentStatusInProgress: string
  experimentStatusCompleted: string
  experimentStatusPending: string
  reagentsTabInventory: string
  reagentsTabDisposed: string
  reagentsAddButton: string
  reagentsClearDisposedButton: string
  reagentsClearDisposedTitle: string
  reagentsClearDisposedDescription: string
  reagentsClearDisposedConfirm: string
  reagentsTableName: string
  reagentsTableFormula: string
  reagentsTablePurchaseDate: string
  reagentsTableOpenDate: string
  reagentsTableCurrentVolume: string
  reagentsTableDensity: string
  reagentsTableMass: string
  reagentsTablePurity: string
  reagentsTableActions: string
  reagentsDisposeTitle: string
  reagentsDisposeDescription: string
  reagentsDisposeConfirm: string
  reagentsDisposedTableName: string
  reagentsDisposedTableFormula: string
  reagentsDisposedTableDate: string
  reagentsDisposedTableBy: string
  reagentsDisposedTableActions: string
  reagentsDeleteTitle: string
  reagentsDeleteDescription: string
  reagentsDeleteConfirm: string
  reagentsStorageTitle: string
  reagentsStorageTypeGeneral: string
  reagentsStorageTypeCold: string
  reagentsStorageTypeHazard: string
  reagentsStorageStatusNormal: string
  reagentsStorageStatusWarning: string
  reagentsStorageUsage: string
  reagentsStorageTemp: string
  reagentsStorageHumidity: string
  reagentsAddDialogTitle: string
  reagentsEditDialogTitle: string
  reagentsLabelName: string
  reagentsLabelFormula: string
  reagentsLabelCapacity: string
  reagentsLabelDensity: string
  reagentsLabelMass: string
  reagentsLabelLocation: string
  reagentsLabelPurchaseDate: string
  accidentTabConversation: string
  accidentTabEmail: string
  accidentTabStatus: string
  accidentConversationTableTime: string
  accidentConversationTableUser: string
  accidentConversationTableCommand: string
  accidentConversationTableStatus: string
  accidentConversationStatusCompleted: string
  accidentConversationStatusPending: string
  accidentConversationStatusFailed: string
  accidentEmailStatusDelivered: string
  accidentEmailStatusPending: string
  accidentEmailStatusFailed: string
  accidentSummaryActive: string
  accidentSummaryAcknowledged: string
  accidentSummaryResolved: string
  accidentReportedLabel: string
  accidentActionAcknowledge: string
  accidentActionResolve: string
  accidentBadgeResolved: string
  accidentBadgeFalseAlarm: string
  accidentSeverityCritical: string
  accidentSeverityHigh: string
  accidentSeverityMedium: string
  accidentSeverityLow: string
  tabRecords: string
  titleRecords: string
  csvDownloadTitle: string
  csvDownloadLogType: string
  csvDownloadLogConversation: string
  csvDownloadLogAccident: string
  csvDownloadLogExperiment: string
  csvDownloadRange: string
  csvDownloadRecent1000: string
  csvDownloadAll: string
  csvDownloadButton: string
  csvTabDownload: string
  settingsTitle: string
  settingsTheme: string
  settingsThemeLight: string
  settingsThemeDark: string
  settingsThemeSystem: string
  settingsLanguage: string
  showMore: string
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
    mobileToggleChat: "채팅",
    mobileToggleStatus: "환경상태 및 알림",
    systemNormal: "시스템 정상",
    chatEmpty: "채팅방을 선택하거나 새로 시작하세요.",
    chatLoading: "메시지를 불러오는 중...",
    chatPlaceholder: "시약, 실험, 안전 프로토콜을 물어보세요...",
    send: "전송",
    voiceListening: "음성 인식 중...",
    voiceStart: "음성 인식 시작",
    voiceStop: "음성 인식 중지",
    voiceNotSupported: "음성 인식이 지원되지 않습니다",
    voiceWakeWordHint: "\"Hey LabbyIT\"이라고 말해보세요",
    userName: "연구원",
    userRole: "관리자",
    envStatusTitle: "환경 상태",
    envTemperature: "온도",
    envHumidity: "습도",
    envVentilation: "환기",
    envAirQuality: "공기질",
    envVentilationValue: "가동 중",
    envAirQualityValue: "양호",
    envCamera: "카메라 연결 상태",
    envScale: "저울 연결 상태",
    envCameraValue: "연결됨",
    envScaleValue: "연결됨",
    envDisconnectedValue: "미연결",
    envNoDevices: "연결된 장치 없음",
    envTimestampLabel: "시간",
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
    actionCancel: "취소",
    actionAdd: "추가",
    actionSave: "저장",
    actionEdit: "수정",
    actionRefresh: "새로고침",
    updatedAtLabel: "업데이트",
    actionCollapse: "접기",
    actionExpand: "펼치기",
    experimentsListTitle: "실험 목록",
    experimentsNewButton: "새 실험",
    experimentsDialogTitle: "새 실험 추가",
    experimentsDialogDescription: "새로운 실험 정보를 입력하세요.",
    experimentsLabelTitle: "실험 제목",
    experimentsLabelResearcher: "담당 연구원",
    experimentsReagentsTitle: "사용 시약",
    experimentsAddReagentButton: "시약 추가",
    experimentsAddReagentTitle: "시약 추가",
    experimentsAddReagentDescription: "시약 관리 재고에서 시약을 선택하고 사용량을 입력하세요.",
    experimentsReagentSelectLabel: "시약 선택",
    experimentsReagentSearchEmpty: "검색 결과가 없습니다.",
    experimentsReagentAvailableHeading: "사용 가능한 시약",
    experimentsLabelLocation: "위치",
    experimentsLabelStock: "재고",
    experimentsLabelPurity: "순도",
    experimentsLabelDosage: "사용량",
    experimentsReagentDosageLabel: "투입량",
    experimentsLabelCurrentVolume: "현재 재고",
    experimentsLabelDensity: "밀도",
    experimentsLabelMass: "질량",
    experimentsLabelReagentId: "시약 ID",
    experimentsMemoTitle: "연구 메모",
    experimentsMemoSave: "메모 저장",
    experimentStatusInProgress: "진행중",
    experimentStatusCompleted: "완료",
    experimentStatusPending: "대기",
    reagentsTabInventory: "시약 재고",
    reagentsTabDisposed: "폐기 목록",
    reagentsAddButton: "시약 추가",
    reagentsClearDisposedButton: "전체 삭제",
    reagentsClearDisposedTitle: "모든 폐기된 시약을 영구 삭제",
    reagentsClearDisposedDescription: "모든 폐기된 시약을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    reagentsClearDisposedConfirm: "영구 삭제",
    reagentsTableName: "시약 이름",
    reagentsTableFormula: "화학식",
    reagentsTablePurchaseDate: "구매일",
    reagentsTableOpenDate: "개봉일",
    reagentsTableCurrentVolume: "현재 용량(ml)",
    reagentsTableDensity: "밀도(g/cm³)",
    reagentsTableMass: "질량(g)",
    reagentsTablePurity: "순도",
    reagentsTableActions: "작업",
    reagentsDisposeTitle: "시약 폐기",
    reagentsDisposeDescription: "{name}을(를) 폐기하시겠습니까?",
    reagentsDisposeConfirm: "폐기",
    reagentsDisposedTableName: "시약명",
    reagentsDisposedTableFormula: "화학식",
    reagentsDisposedTableDate: "폐기일",
    reagentsDisposedTableBy: "처리자",
    reagentsDisposedTableActions: "작업",
    reagentsDeleteTitle: "영구 삭제",
    reagentsDeleteDescription: "{name}을(를) 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    reagentsDeleteConfirm: "영구 삭제",
    reagentsStorageTitle: "보관 환경 모니터링",
    reagentsStorageTypeGeneral: "일반",
    reagentsStorageTypeCold: "냉장",
    reagentsStorageTypeHazard: "위험물",
    reagentsStorageStatusNormal: "정상",
    reagentsStorageStatusWarning: "주의",
    reagentsStorageUsage: "사용률",
    reagentsStorageTemp: "온도",
    reagentsStorageHumidity: "습도",
    reagentsAddDialogTitle: "시약 추가",
    reagentsEditDialogTitle: "시약 정보 수정",
    reagentsLabelName: "시약명",
    reagentsLabelFormula: "화학식",
    reagentsLabelCapacity: "용량 (ml)",
    reagentsLabelDensity: "밀도(g/cm³)",
    reagentsLabelMass: "질량 (g)",
    reagentsLabelLocation: "보관 위치",
    reagentsLabelPurchaseDate: "구매일",
    accidentTabConversation: "대화 로그",
    accidentTabEmail: "이메일 로그",
    accidentTabStatus: "사고 상태",
    accidentConversationTableTime: "시간",
    accidentConversationTableUser: "사용자",
    accidentConversationTableCommand: "명령/지시",
    accidentConversationTableStatus: "상태",
    accidentConversationStatusCompleted: "완료",
    accidentConversationStatusPending: "대기 중",
    accidentConversationStatusFailed: "실패",
    accidentEmailStatusDelivered: "전송됨",
    accidentEmailStatusPending: "대기 중",
    accidentEmailStatusFailed: "실패",
    accidentSummaryActive: "활성 경보",
    accidentSummaryAcknowledged: "확인됨",
    accidentSummaryResolved: "해결됨",
    accidentReportedLabel: "보고",
    accidentActionAcknowledge: "사건 확인",
    accidentActionResolve: "해결 완료",
    accidentBadgeResolved: "해결됨",
    accidentBadgeFalseAlarm: "오경보",
    accidentSeverityCritical: "치명적",
    accidentSeverityHigh: "높음",
    accidentSeverityMedium: "중간",
    accidentSeverityLow: "낮음",
    tabRecords: "기록",
    titleRecords: "사고 확인 및 로그 모니터링",
    csvDownloadTitle: "CSV 다운로드",
    csvDownloadLogType: "로그 유형 선택",
    csvDownloadLogConversation: "대화 로그",
    csvDownloadLogAccident: "사고 로그",
    csvDownloadLogExperiment: "실험 로그",
    csvDownloadRange: "다운로드 범위",
    csvDownloadRecent1000: "최근 1,000개 행",
    csvDownloadAll: "전체 데이터",
    csvDownloadButton: "CSV 다운로드",
    csvTabDownload: "데이터 내보내기",
    settingsTitle: "설정",
    settingsTheme: "테마",
    settingsThemeLight: "라이트",
    settingsThemeDark: "다크",
    settingsThemeSystem: "시스템",
    settingsLanguage: "언어",
    showMore: "더보기",
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
    mobileToggleChat: "Chat",
    mobileToggleStatus: "Environment & Alerts",
    systemNormal: "System Normal",
    chatEmpty: "Select a chat room or start a new one to begin.",
    chatLoading: "Loading messages...",
    chatPlaceholder: "Ask about chemical samples or safety protocols...",
    send: "Send",
    voiceListening: "Listening...",
    voiceStart: "Start voice recognition",
    voiceStop: "Stop voice recognition",
    voiceNotSupported: "Voice recognition is not supported",
    voiceWakeWordHint: "Say \"Hey LabbyIT\" to start",
    userName: "Researcher",
    userRole: "Administrator",
    envStatusTitle: "Environment Status",
    envTemperature: "Temperature",
    envHumidity: "Humidity",
    envVentilation: "Ventilation",
    envAirQuality: "Air Quality",
    envVentilationValue: "Active",
    envAirQualityValue: "Good",
    envCamera: "Camera Connection",
    envScale: "Scale Connection",
    envCameraValue: "Connected",
    envScaleValue: "Connected",
    envDisconnectedValue: "Disconnected",
    envNoDevices: "No connected devices",
    envTimestampLabel: "Time",
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
    actionCancel: "Cancel",
    actionAdd: "Add",
    actionSave: "Save",
    actionEdit: "Edit",
    actionRefresh: "Refresh",
    updatedAtLabel: "Updated",
    actionCollapse: "Collapse",
    actionExpand: "Expand",
    experimentsListTitle: "Experiment List",
    experimentsNewButton: "New Experiment",
    experimentsDialogTitle: "Add New Experiment",
    experimentsDialogDescription: "Enter the new experiment details.",
    experimentsLabelTitle: "Experiment Title",
    experimentsLabelResearcher: "Researcher",
    experimentsReagentsTitle: "Used Reagents",
    experimentsAddReagentButton: "Add Reagent",
    experimentsAddReagentTitle: "Add Reagent",
    experimentsAddReagentDescription: "Select a reagent from inventory and enter the dosage.",
    experimentsReagentSelectLabel: "Select Reagent",
    experimentsReagentSearchEmpty: "No results found.",
    experimentsReagentAvailableHeading: "Available Reagents",
    experimentsLabelLocation: "Location",
    experimentsLabelStock: "Stock",
    experimentsLabelPurity: "Purity",
    experimentsLabelDosage: "Dosage",
    experimentsReagentDosageLabel: "Dosage",
    experimentsLabelCurrentVolume: "Current Volume",
    experimentsLabelDensity: "Density",
    experimentsLabelMass: "Mass",
    experimentsLabelReagentId: "Reagent ID",
    experimentsMemoTitle: "Research Notes",
    experimentsMemoSave: "Save Notes",
    experimentStatusInProgress: "In Progress",
    experimentStatusCompleted: "Completed",
    experimentStatusPending: "Pending",
    reagentsTabInventory: "Inventory",
    reagentsTabDisposed: "Disposed",
    reagentsAddButton: "Add Reagent",
    reagentsClearDisposedButton: "Delete All",
    reagentsClearDisposedTitle: "Permanently delete all disposed reagents",
    reagentsClearDisposedDescription: "Delete all disposed reagents permanently? This action cannot be undone.",
    reagentsClearDisposedConfirm: "Delete Permanently",
    reagentsTableName: "Reagent Name",
    reagentsTableFormula: "Formula",
    reagentsTablePurchaseDate: "Purchase Date",
    reagentsTableOpenDate: "Opened Date",
    reagentsTableCurrentVolume: "Current Volume (ml)",
    reagentsTableDensity: "Density (g/cm³)",
    reagentsTableMass: "Mass (g)",
    reagentsTablePurity: "Purity",
    reagentsTableActions: "Actions",
    reagentsDisposeTitle: "Dispose Reagent",
    reagentsDisposeDescription: "Dispose {name}?",
    reagentsDisposeConfirm: "Dispose",
    reagentsDisposedTableName: "Reagent Name",
    reagentsDisposedTableFormula: "Formula",
    reagentsDisposedTableDate: "Disposed Date",
    reagentsDisposedTableBy: "Handled By",
    reagentsDisposedTableActions: "Actions",
    reagentsDeleteTitle: "Delete Permanently",
    reagentsDeleteDescription: "Delete {name} permanently? This action cannot be undone.",
    reagentsDeleteConfirm: "Delete Permanently",
    reagentsStorageTitle: "Storage Environment Monitoring",
    reagentsStorageTypeGeneral: "General",
    reagentsStorageTypeCold: "Cold",
    reagentsStorageTypeHazard: "Hazard",
    reagentsStorageStatusNormal: "Normal",
    reagentsStorageStatusWarning: "Warning",
    reagentsStorageUsage: "Usage",
    reagentsStorageTemp: "Temperature",
    reagentsStorageHumidity: "Humidity",
    reagentsAddDialogTitle: "Add Reagent",
    reagentsEditDialogTitle: "Edit Reagent",
    reagentsLabelName: "Reagent Name",
    reagentsLabelFormula: "Formula",
    reagentsLabelCapacity: "Capacity (ml)",
    reagentsLabelDensity: "Density (g/cm³)",
    reagentsLabelMass: "Mass (g)",
    reagentsLabelLocation: "Storage Location",
    reagentsLabelPurchaseDate: "Purchase Date",
    accidentTabConversation: "Conversation Logs",
    accidentTabEmail: "Email Logs",
    accidentTabStatus: "Accident Status",
    accidentConversationTableTime: "Time",
    accidentConversationTableUser: "User",
    accidentConversationTableCommand: "Command",
    accidentConversationTableStatus: "Status",
    accidentConversationStatusCompleted: "Completed",
    accidentConversationStatusPending: "Pending",
    accidentConversationStatusFailed: "Failed",
    accidentEmailStatusDelivered: "Delivered",
    accidentEmailStatusPending: "Pending",
    accidentEmailStatusFailed: "Failed",
    accidentSummaryActive: "Active Alerts",
    accidentSummaryAcknowledged: "Acknowledged",
    accidentSummaryResolved: "Resolved",
    accidentReportedLabel: "Reported",
    accidentActionAcknowledge: "Acknowledge",
    accidentActionResolve: "Resolve",
    accidentBadgeResolved: "Resolved",
    accidentBadgeFalseAlarm: "False Alarm",
    accidentSeverityCritical: "Critical",
    accidentSeverityHigh: "High",
    accidentSeverityMedium: "Medium",
    accidentSeverityLow: "Low",
    tabRecords: "Records",
    titleRecords: "Accident Confirmation & Log Monitoring",
    csvDownloadTitle: "CSV Download",
    csvDownloadLogType: "Select Log Type",
    csvDownloadLogConversation: "Conversation Logs",
    csvDownloadLogAccident: "Accident Logs",
    csvDownloadLogExperiment: "Experiment Logs",
    csvDownloadRange: "Download Range",
    csvDownloadRecent1000: "Recent 1,000 rows",
    csvDownloadAll: "All data",
    csvDownloadButton: "Download CSV",
    csvTabDownload: "Export Data",
    settingsTitle: "Settings",
    settingsTheme: "Theme",
    settingsThemeLight: "Light",
    settingsThemeDark: "Dark",
    settingsThemeSystem: "System",
    settingsLanguage: "Language",
    showMore: "Show more",
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
    mobileToggleChat: "チャット",
    mobileToggleStatus: "環境状態とアラート",
    systemNormal: "システム正常",
    chatEmpty: "チャットルームを選ぶか新規作成してください。",
    chatLoading: "メッセージを読み込み中...",
    chatPlaceholder: "試薬・実験・安全プロトコルについて質問してください...",
    send: "送信",
    voiceListening: "音声認識中...",
    voiceStart: "音声認識を開始",
    voiceStop: "音声認識を停止",
    voiceNotSupported: "音声認識はサポートされていません",
    voiceWakeWordHint: "「Hey LabbyIT」と言ってください",
    userName: "研究員",
    userRole: "管理者",
    envStatusTitle: "環境状態",
    envTemperature: "温度",
    envHumidity: "湿度",
    envVentilation: "換気",
    envAirQuality: "空気質",
    envVentilationValue: "稼働中",
    envAirQualityValue: "良好",
    envCamera: "カメラ接続",
    envScale: "秤接続",
    envCameraValue: "接続済み",
    envScaleValue: "接続済み",
    envDisconnectedValue: "未接続",
    envNoDevices: "接続されたデバイスなし",
    envTimestampLabel: "時間",
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
    actionCancel: "キャンセル",
    actionAdd: "追加",
    actionSave: "保存",
    actionEdit: "編集",
    actionRefresh: "更新",
    updatedAtLabel: "更新",
    actionCollapse: "折りたたむ",
    actionExpand: "展開",
    experimentsListTitle: "実験一覧",
    experimentsNewButton: "新規実験",
    experimentsDialogTitle: "新しい実験を追加",
    experimentsDialogDescription: "新しい実験情報を入力してください。",
    experimentsLabelTitle: "実験タイトル",
    experimentsLabelResearcher: "担当研究者",
    experimentsReagentsTitle: "使用試薬",
    experimentsAddReagentButton: "試薬追加",
    experimentsAddReagentTitle: "試薬追加",
    experimentsAddReagentDescription: "在庫から試薬を選択し、使用量を入力してください。",
    experimentsReagentSelectLabel: "試薬を選択",
    experimentsReagentSearchEmpty: "検索結果がありません。",
    experimentsReagentAvailableHeading: "使用可能な試薬",
    experimentsLabelLocation: "場所",
    experimentsLabelStock: "在庫",
    experimentsLabelPurity: "純度",
    experimentsLabelDosage: "使用量",
    experimentsReagentDosageLabel: "投与量",
    experimentsLabelCurrentVolume: "現在在庫",
    experimentsLabelDensity: "密度",
    experimentsLabelMass: "質量",
    experimentsLabelReagentId: "試薬ID",
    experimentsMemoTitle: "研究メモ",
    experimentsMemoSave: "メモ保存",
    experimentStatusInProgress: "進行中",
    experimentStatusCompleted: "完了",
    experimentStatusPending: "待機",
    reagentsTabInventory: "試薬在庫",
    reagentsTabDisposed: "廃棄一覧",
    reagentsAddButton: "試薬追加",
    reagentsClearDisposedButton: "すべて削除",
    reagentsClearDisposedTitle: "廃棄済み試薬をすべて永久削除",
    reagentsClearDisposedDescription: "廃棄済み試薬をすべて永久削除しますか？この操作は元に戻せません。",
    reagentsClearDisposedConfirm: "永久削除",
    reagentsTableName: "試薬名",
    reagentsTableFormula: "化学式",
    reagentsTablePurchaseDate: "購入日",
    reagentsTableOpenDate: "開封日",
    reagentsTableCurrentVolume: "現在量(ml)",
    reagentsTableDensity: "密度(g/cm³)",
    reagentsTableMass: "質量(g)",
    reagentsTablePurity: "純度",
    reagentsTableActions: "操作",
    reagentsDisposeTitle: "試薬廃棄",
    reagentsDisposeDescription: "{name}を廃棄しますか？",
    reagentsDisposeConfirm: "廃棄",
    reagentsDisposedTableName: "試薬名",
    reagentsDisposedTableFormula: "化学式",
    reagentsDisposedTableDate: "廃棄日",
    reagentsDisposedTableBy: "処理者",
    reagentsDisposedTableActions: "操作",
    reagentsDeleteTitle: "永久削除",
    reagentsDeleteDescription: "{name}を永久削除しますか？この操作は元に戻せません。",
    reagentsDeleteConfirm: "永久削除",
    reagentsStorageTitle: "保管環境モニタリング",
    reagentsStorageTypeGeneral: "一般",
    reagentsStorageTypeCold: "冷蔵",
    reagentsStorageTypeHazard: "危険物",
    reagentsStorageStatusNormal: "正常",
    reagentsStorageStatusWarning: "注意",
    reagentsStorageUsage: "使用率",
    reagentsStorageTemp: "温度",
    reagentsStorageHumidity: "湿度",
    reagentsAddDialogTitle: "試薬追加",
    reagentsEditDialogTitle: "試薬情報の編集",
    reagentsLabelName: "試薬名",
    reagentsLabelFormula: "化学式",
    reagentsLabelCapacity: "容量 (ml)",
    reagentsLabelDensity: "密度(g/cm³)",
    reagentsLabelMass: "質量 (g)",
    reagentsLabelLocation: "保管場所",
    reagentsLabelPurchaseDate: "購入日",
    accidentTabConversation: "会話ログ",
    accidentTabEmail: "メールログ",
    accidentTabStatus: "事故ステータス",
    accidentConversationTableTime: "時間",
    accidentConversationTableUser: "ユーザー",
    accidentConversationTableCommand: "指示",
    accidentConversationTableStatus: "状態",
    accidentConversationStatusCompleted: "完了",
    accidentConversationStatusPending: "待機中",
    accidentConversationStatusFailed: "失敗",
    accidentEmailStatusDelivered: "送信済み",
    accidentEmailStatusPending: "待機中",
    accidentEmailStatusFailed: "失敗",
    accidentSummaryActive: "アクティブ警報",
    accidentSummaryAcknowledged: "確認済み",
    accidentSummaryResolved: "解決済み",
    accidentReportedLabel: "報告",
    accidentActionAcknowledge: "確認",
    accidentActionResolve: "解決",
    accidentBadgeResolved: "解決済み",
    accidentBadgeFalseAlarm: "誤警報",
    accidentSeverityCritical: "重大",
    accidentSeverityHigh: "高",
    accidentSeverityMedium: "中",
    accidentSeverityLow: "低",
    tabRecords: "記録",
    titleRecords: "事故確認・ログ監視",
    csvDownloadTitle: "CSVダウンロード",
    csvDownloadLogType: "ログタイプを選択",
    csvDownloadLogConversation: "会話ログ",
    csvDownloadLogAccident: "事故ログ",
    csvDownloadLogExperiment: "実験ログ",
    csvDownloadRange: "ダウンロード範囲",
    csvDownloadRecent1000: "直近1,000件",
    csvDownloadAll: "全データ",
    csvDownloadButton: "CSVダウンロード",
    csvTabDownload: "データエクスポート",
    settingsTitle: "設定",
    settingsTheme: "テーマ",
    settingsThemeLight: "ライト",
    settingsThemeDark: "ダーク",
    settingsThemeSystem: "システム",
    settingsLanguage: "言語",
    showMore: "もっと見る",
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
    mobileToggleChat: "聊天",
    mobileToggleStatus: "环境状态与警报",
    systemNormal: "系统正常",
    chatEmpty: "请选择一个聊天室或新建开始。",
    chatLoading: "正在加载消息...",
    chatPlaceholder: "咨询化学样品或安全规程...",
    send: "发送",
    voiceListening: "语音识别中...",
    voiceStart: "开始语音识别",
    voiceStop: "停止语音识别",
    voiceNotSupported: "不支持语音识别",
    voiceWakeWordHint: "请说\"Hey LabbyIT\"",
    userName: "研究员",
    userRole: "管理员",
    envStatusTitle: "环境状态",
    envTemperature: "温度",
    envHumidity: "湿度",
    envVentilation: "通风",
    envAirQuality: "空气质量",
    envVentilationValue: "运行中",
    envAirQualityValue: "良好",
    envCamera: "摄像头连接",
    envScale: "秤连接",
    envCameraValue: "已连接",
    envScaleValue: "已连接",
    envDisconnectedValue: "未连接",
    envNoDevices: "未连接任何设备",
    envTimestampLabel: "时间",
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
    actionCancel: "取消",
    actionAdd: "添加",
    actionSave: "保存",
    actionEdit: "编辑",
    actionRefresh: "刷新",
    updatedAtLabel: "更新",
    actionCollapse: "收起",
    actionExpand: "展开",
    experimentsListTitle: "实验列表",
    experimentsNewButton: "新建实验",
    experimentsDialogTitle: "添加新实验",
    experimentsDialogDescription: "请输入新的实验信息。",
    experimentsLabelTitle: "实验标题",
    experimentsLabelResearcher: "负责人",
    experimentsReagentsTitle: "使用试剂",
    experimentsAddReagentButton: "添加试剂",
    experimentsAddReagentTitle: "添加试剂",
    experimentsAddReagentDescription: "从库存中选择试剂并输入使用量。",
    experimentsReagentSelectLabel: "选择试剂",
    experimentsReagentSearchEmpty: "无搜索结果。",
    experimentsReagentAvailableHeading: "可用试剂",
    experimentsLabelLocation: "位置",
    experimentsLabelStock: "库存",
    experimentsLabelPurity: "纯度",
    experimentsLabelDosage: "用量",
    experimentsReagentDosageLabel: "投加量",
    experimentsLabelCurrentVolume: "当前库存",
    experimentsLabelDensity: "密度",
    experimentsLabelMass: "质量",
    experimentsLabelReagentId: "试剂 ID",
    experimentsMemoTitle: "研究备注",
    experimentsMemoSave: "保存备注",
    experimentStatusInProgress: "进行中",
    experimentStatusCompleted: "已完成",
    experimentStatusPending: "待处理",
    reagentsTabInventory: "试剂库存",
    reagentsTabDisposed: "废弃列表",
    reagentsAddButton: "添加试剂",
    reagentsClearDisposedButton: "全部删除",
    reagentsClearDisposedTitle: "永久删除所有废弃试剂",
    reagentsClearDisposedDescription: "确定永久删除所有废弃试剂吗？此操作无法撤销。",
    reagentsClearDisposedConfirm: "永久删除",
    reagentsTableName: "试剂名称",
    reagentsTableFormula: "化学式",
    reagentsTablePurchaseDate: "购买日期",
    reagentsTableOpenDate: "开封日期",
    reagentsTableCurrentVolume: "当前容量(ml)",
    reagentsTableDensity: "密度(g/cm³)",
    reagentsTableMass: "质量(g)",
    reagentsTablePurity: "纯度",
    reagentsTableActions: "操作",
    reagentsDisposeTitle: "废弃试剂",
    reagentsDisposeDescription: "确定废弃 {name} 吗？",
    reagentsDisposeConfirm: "废弃",
    reagentsDisposedTableName: "试剂名称",
    reagentsDisposedTableFormula: "化学式",
    reagentsDisposedTableDate: "废弃日期",
    reagentsDisposedTableBy: "处理人",
    reagentsDisposedTableActions: "操作",
    reagentsDeleteTitle: "永久删除",
    reagentsDeleteDescription: "确定永久删除 {name} 吗？此操作无法撤销。",
    reagentsDeleteConfirm: "永久删除",
    reagentsStorageTitle: "存储环境监控",
    reagentsStorageTypeGeneral: "常温",
    reagentsStorageTypeCold: "冷藏",
    reagentsStorageTypeHazard: "危险品",
    reagentsStorageStatusNormal: "正常",
    reagentsStorageStatusWarning: "注意",
    reagentsStorageUsage: "使用率",
    reagentsStorageTemp: "温度",
    reagentsStorageHumidity: "湿度",
    reagentsAddDialogTitle: "添加试剂",
    reagentsEditDialogTitle: "编辑试剂信息",
    reagentsLabelName: "试剂名称",
    reagentsLabelFormula: "化学式",
    reagentsLabelCapacity: "容量 (ml)",
    reagentsLabelDensity: "密度(g/cm³)",
    reagentsLabelMass: "质量 (g)",
    reagentsLabelLocation: "存放位置",
    reagentsLabelPurchaseDate: "购买日期",
    accidentTabConversation: "对话日志",
    accidentTabEmail: "邮件日志",
    accidentTabStatus: "事故状态",
    accidentConversationTableTime: "时间",
    accidentConversationTableUser: "用户",
    accidentConversationTableCommand: "指令",
    accidentConversationTableStatus: "状态",
    accidentConversationStatusCompleted: "完成",
    accidentConversationStatusPending: "处理中",
    accidentConversationStatusFailed: "失败",
    accidentEmailStatusDelivered: "已送达",
    accidentEmailStatusPending: "待处理",
    accidentEmailStatusFailed: "失败",
    accidentSummaryActive: "活动警报",
    accidentSummaryAcknowledged: "已确认",
    accidentSummaryResolved: "已解决",
    accidentReportedLabel: "报告",
    accidentActionAcknowledge: "确认",
    accidentActionResolve: "解决",
    accidentBadgeResolved: "已解决",
    accidentBadgeFalseAlarm: "误报",
    accidentSeverityCritical: "严重",
    accidentSeverityHigh: "高",
    accidentSeverityMedium: "中",
    accidentSeverityLow: "低",
    tabRecords: "记录",
    titleRecords: "事故确认与日志监控",
    csvDownloadTitle: "CSV下载",
    csvDownloadLogType: "选择日志类型",
    csvDownloadLogConversation: "对话日志",
    csvDownloadLogAccident: "事故日志",
    csvDownloadLogExperiment: "实验日志",
    csvDownloadRange: "下载范围",
    csvDownloadRecent1000: "最近1,000条",
    csvDownloadAll: "全部数据",
    csvDownloadButton: "下载CSV",
    csvTabDownload: "数据导出",
    settingsTitle: "设置",
    settingsTheme: "主题",
    settingsThemeLight: "浅色",
    settingsThemeDark: "深色",
    settingsThemeSystem: "系统",
    settingsLanguage: "语言",
    showMore: "显示更多",
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

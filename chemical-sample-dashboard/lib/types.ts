export type Quantity = {
  value: number;
  unit: string;
};

export type ExperimentStatus = "진행중" | "대기" | "완료";

export type ExperimentSummary = {
  id: string;
  title: string;
  titleI18n?: string | null;
  date?: string | null;
  status: ExperimentStatus;
  researcher?: string | null;
};

export type ExperimentReagent = {
  id: string;
  reagentId: string;
  name: string;
  nameI18n?: string | null;
  formula?: string | null;
  dosage: Quantity;
  density?: number | null;
  mass?: number | null;
  purity?: number | null;
  location?: string | null;
  locationI18n?: string | null;
};

export type ExperimentDetail = ExperimentSummary & {
  memo?: string | null;
  memoI18n?: string | null;
  reagents: ExperimentReagent[];
};

export type ExperimentListResponse = {
  items: ExperimentSummary[];
  nextCursor?: string | null;
};

export type ExperimentCreateRequest = {
  title: string;
  researcher?: string | null;
  date?: string | null;
  status?: ExperimentStatus;
  memo?: string | null;
};

export type ExperimentUpdateRequest = {
  title?: string | null;
  researcher?: string | null;
  date?: string | null;
  status?: ExperimentStatus;
  memo?: string | null;
};

export type ExperimentReagentCreateRequest = {
  reagentId: string;
  dosage: Quantity;
};

export type ReagentStatus = "normal" | "low" | "expired";
export type StorageStatus = "normal" | "warning" | "critical";

export type ReagentItem = {
  id: string;
  name: string;
  nameI18n?: string | null;
  formula?: string | null;
  purchaseDate?: string | null;
  openDate?: string | null;
  currentVolume?: Quantity | null;
  originalVolume?: Quantity | null;
  density?: number | null;
  mass?: number | null;
  purity?: number | null;
  location?: string | null;
  locationI18n?: string | null;
  status?: ReagentStatus | null;
};

export type ReagentListResponse = {
  items: ReagentItem[];
  nextCursor?: string | null;
};

export type ReagentCreateRequest = {
  id?: string | null;
  name: string;
  formula: string;
  purchaseDate?: string | null;
  openDate?: string | null;
  currentVolume?: Quantity | null;
  originalVolume: Quantity;
  density?: number | null;
  mass?: number | null;
  purity: number;
  location: string;
  status?: ReagentStatus | null;
};

export type ReagentUpdateRequest = {
  name?: string | null;
  formula?: string | null;
  purchaseDate?: string | null;
  openDate?: string | null;
  currentVolume?: Quantity | null;
  originalVolume?: Quantity | null;
  density?: number | null;
  mass?: number | null;
  purity?: number | null;
  location?: string | null;
  status?: ReagentStatus | null;
};

export type ReagentDisposalCreateRequest = {
  reason: string;
  disposedBy: string;
};

export type ReagentDisposalResponse = {
  id: string;
  name: string;
  nameI18n?: string | null;
  formula?: string | null;
  disposalDate: string;
  reason: string;
  reasonI18n?: string | null;
  disposedBy: string;
};

export type ReagentDisposalListResponse = {
  items: ReagentDisposalResponse[];
  nextCursor?: string | null;
};

export type StorageEnvironmentItem = {
  location: string;
  temp: number;
  humidity: number;
  status: StorageStatus;
};

export type StorageEnvironmentResponse = {
  items: StorageEnvironmentItem[];
};

export type MonitoringOverviewResponse = {
  model: string;
  lastUpdated: string;
  fps: number;
};

export type ChatRoomType = "public" | "private";
export type ChatMessageRole = "user" | "assistant" | "system";
export type ChatSenderType = "guest" | "user" | "assistant" | "system";

export type ChatRoom = {
  id: string;
  title: string;
  titleI18n?: string | null;
  roomType: ChatRoomType;
  createdAt: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  lastMessagePreviewI18n?: string | null;
};

export type ChatRoomListResponse = {
  items: ChatRoom[];
  nextCursor?: string | null;
};

export type ChatRoomCreateRequest = {
  title?: string | null;
};

export type ChatRoomUpdateRequest = {
  title?: string | null;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  role: ChatMessageRole;
  content: string;
  contentI18n?: string | null;
  createdAt: string;
  senderType: ChatSenderType;
  senderId?: string | null;
  senderName?: string | null;
};

export type ChatMessageListResponse = {
  items: ChatMessage[];
  nextCursor?: string | null;
};

export type ChatMessageCreateRequest = {
  message: string;
  user?: string | null;
  sender_type?: ChatSenderType;
  sender_id?: string | null;
};

export type ChatMessageCreateResponse = {
  roomId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
};

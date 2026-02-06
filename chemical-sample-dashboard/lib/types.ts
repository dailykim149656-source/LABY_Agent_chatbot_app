export type Quantity = {
  value: number;
  unit: string;
};

export type ExperimentStatus = "in_progress" | "pending" | "completed";

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
  name: string;
  formula?: string | null;
  purchaseDate?: string | null;
  currentVolume?: Quantity | null;
  originalVolume: Quantity;
  density?: number | null;
  mass?: number | null;
  purity?: number | null;
  location: string;
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

export type UserRole = "admin" | "user";

export type User = {
  id: number;
  email: string;
  name?: string | null;
  affiliation?: string | null;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  profileImageUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupConsent = {
  version: string;
  required: boolean;
  phone: boolean;
  iotEnvironment: boolean;
  iotReagent: boolean;
  voice: boolean;
  video: boolean;
  marketing: boolean;
};

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  affiliation: string;
  department: string;
  position: string;
  phone?: string | null;
  contactEmail?: string | null;
  consent: SignupConsent;
};

export type LoginResponse = {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
  csrf_token?: string | null;
};

export type UserListResponse = {
  items: User[];
  total: number;
  nextCursor?: string | null;
};

export type AuthEventType = "login" | "logout";

export type AuthLog = {
  id: number;
  eventType: AuthEventType;
  success: boolean;
  loggedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuthLogListResponse = {
  items: AuthLog[];
};

export type UserCreateRequest = {
  email: string;
  password: string;
  name: string;
  affiliation: string;
  department: string;
  position: string;
  phone?: string | null;
  contactEmail?: string | null;
  profileImageUrl?: string | null;
  consent: SignupConsent;
  role?: UserRole;
};

export type UserUpdateRequest = {
  name?: string | null;
  affiliation?: string | null;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  profileImageUrl?: string | null;
  role?: UserRole;
  isActive?: boolean | null;
};

export type UserSelfUpdateRequest = {
  name?: string | null;
  affiliation?: string | null;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  profileImageUrl?: string | null;
};

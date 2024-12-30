export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  citations?: Citation[]
}

export interface Citation {
  text: string
  reference: string
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
}

export interface ChatSession {
  id: string
  created_at: string
}


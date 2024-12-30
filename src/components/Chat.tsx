import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Message } from './Message'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { qaChain } from '@/lib/langchain'
import type { Message as MessageType, ChatState } from '@/types'

export function Chat() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  })
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUserAndSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (error) {
          console.error('Error creating chat session:', error)
        } else if (data) {
          setSessionId(data.id)
        }
      }
    }
    fetchUserAndSession()
  }, [])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [chatState.messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !userId || !sessionId) return

    const userMessage: MessageType = {
      id: uuidv4(),
      content: input,
      role: 'user',
    }

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }))
    setInput('')

    try {
      // Store user message
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: input,
      })

      // Get response from LangChain
      const response = await qaChain.call({
        query: input,
      })

      // Extract citations
      const citations = extractCitations(response.text)

      // Store assistant message
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: response.text,
        citations,
      })

      const assistantMessage: MessageType = {
        id: uuidv4(),
        content: response.text,
        role: 'assistant',
        citations,
      }

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }))
    } catch (error) {
      console.error('Error:', error)
      setChatState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {chatState.messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {chatState.isLoading && (
          <div className="flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        )}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a pediatric question..."
            className="flex-grow"
          />
          <Button type="submit" disabled={chatState.isLoading}>
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}

function extractCitations(text: string): { text: string; reference: string }[] {
  const citationRegex = /\[(.*?)\]/g
  const matches = text.match(citationRegex)
  
  if (!matches) return []

  return matches.map(match => {
    const citation = match.slice(1, -1)
    const [text, reference] = citation.split(':')
    return { text: text.trim(), reference: reference.trim() }
  })
}


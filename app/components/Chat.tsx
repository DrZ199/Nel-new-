'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Message } from './Message'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Message as MessageType, ChatState } from '@/types'

export function Chat() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  })
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch response')
      }

      const data = await response.json()
      const assistantMessage: MessageType = {
        id: uuidv4(),
        content: data.content,
        role: 'assistant',
        citations: data.citations,
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
    <div className="w-full max-w-2xl mx-auto">
      <ScrollArea className="h-[600px] p-4 border rounded-lg mb-4">
        {chatState.messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {chatState.isLoading && <p className="text-gray-500">NelsonGPT is thinking...</p>}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a pediatric question..."
          className="flex-grow"
        />
        <Button type="submit" disabled={chatState.isLoading}>
          Send
        </Button>
      </form>
    </div>
  )
}


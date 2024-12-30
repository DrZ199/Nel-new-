import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import type { ChatSession } from '@/types'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])

  useEffect(() => {
    const fetchChatSessions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching chat sessions:', error)
        } else if (data) {
          setChatSessions(data)
        }
      }
    }

    fetchChatSessions()
  }, [])

  return (
    <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-10`}>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Chat History</h2>
        <Button onClick={onClose} className="mb-4">Close Sidebar</Button>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {chatSessions.map((session) => (
            <div key={session.id} className="p-2 hover:bg-gray-100 cursor-pointer rounded">
              {new Date(session.created_at).toLocaleString()}
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}


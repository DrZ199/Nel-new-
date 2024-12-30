import { qaChain } from '../lib/langchain'
import { supabase } from '../lib/supabase'

export async function handleChatRequest(userId: string, sessionId: string, message: string) {
  try {
    // Generate response using LangChain
    const response = await qaChain.call({
      query: message,
    })

    // Extract citations from the response
    const citations = extractCitations(response.text)

    // Store chat message in Supabase
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      user_id: userId,
      role: 'user',
      content: message,
    })

    // Store assistant response in Supabase
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      user_id: userId,
      role: 'assistant',
      content: response.text,
      citations: citations,
    })

    return {
      text: response.text,
      citations: citations,
    }
  } catch (error) {
    console.error('Error in chat request:', error)
    throw error
  }
}

function extractCitations(text: string): { text: string; reference: string }[] {
  const citationRegex = /\[(.*?)\]/g
  const matches = text.match(citationRegex)
  
  if (!matches) return []

  return matches.map(match => {
    const citation = match.slice(1, -1) // Remove square brackets
    const [text, reference] = citation.split(':')
    return { text: text.trim(), reference: reference.trim() }
  })
}


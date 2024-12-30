import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { OpenAI } from '@langchain/openai'
import { RetrievalQAChain } from 'langchain/chains'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

// Initialize OpenAI embeddings
const openAIApiKey = process.env.OPENAI_API_KEY
if (!openAIApiKey) {
  throw new Error('Missing OpenAI API key')
}
const embeddings = new OpenAIEmbeddings({ openAIApiKey })

// Initialize Supabase vector store
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: 'nelson_chunks',
  queryName: 'match_documents',
})

// Initialize OpenAI model
const model = new OpenAI({
  modelName: 'gpt-4', // You can change this to a different model if needed
  temperature: 0.2,
  openAIApiKey,
})

// Create RetrievalQAChain
const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever())

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    // Use the RetrievalQAChain to get a response
    const response = await chain.call({
      query: message,
    })

    // Extract citations from the response
    const citations = extractCitations(response.text)

    return NextResponse.json({
      content: response.text,
      citations: citations,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function extractCitations(text: string): { text: string; reference: string }[] {
  // This is a simple implementation. You might need to adjust it based on the actual format of citations in the responses.
  const citationRegex = /\[(.*?)\]/g
  const matches = text.match(citationRegex)
  
  if (!matches) return []

  return matches.map(match => {
    const citation = match.slice(1, -1) // Remove square brackets
    const [text, reference] = citation.split(':')
    return { text: text.trim(), reference: reference.trim() }
  })
}


import { createClient } from '@supabase/supabase-js'
import { Configuration, OpenAIApi } from 'openai'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.VITE_OPENAI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const configuration = new Configuration({ apiKey: openaiApiKey })
const openai = new OpenAIApi(configuration)

async function chunkAndEmbed() {
  const filePath = path.join(__dirname, '..', 'data', 'nelson_textbook.txt')
  const content = fs.readFileSync(filePath, 'utf-8')

  const chunks = chunkText(content, 1000) // Chunk size of 1000 characters

  for (const [index, chunk] of chunks.entries()) {
    const embedding = await getEmbedding(chunk)
    
    await supabase.from('nelson_chunks').insert({
      content: chunk,
      metadata: { index },
      embedding
    })

    console.log(`Processed chunk ${index + 1} of ${chunks.length}`)
  }

  console.log('Finished processing all chunks')
}

function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  let startIndex = 0

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize
    if (endIndex > text.length) endIndex = text.length

    // Adjust end index to avoid splitting words
    while (endIndex > startIndex && !text[endIndex - 1].match(/\s/)) {
      endIndex--
    }

    chunks.push(text.slice(startIndex, endIndex).trim())
    startIndex = endIndex
  }

  return chunks
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: text
  })

  return response.data.data[0].embedding
}

chunkAndEmbed().catch(console.error)


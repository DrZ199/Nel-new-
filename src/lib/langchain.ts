import { OpenAI } from 'langchain/llms/openai'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase'
import { RetrievalQAChain, loadQAStuffChain } from 'langchain/chains'
import { PromptTemplate } from 'langchain/prompts'
import { supabase } from './supabase'

const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY

const model = new OpenAI({
  openAIApiKey,
  modelName: 'gpt-4',
  temperature: 0.2,
})

const embeddings = new OpenAIEmbeddings({ openAIApiKey })

const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: 'nelson_chunks',
  queryName: 'match_documents',
})

const template = `You are a pediatric knowledge assistant based on the Nelson Textbook of Pediatrics. 
Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer. 
Use three sentences maximum and keep the answer concise. 
Always include relevant citations in the format [Citation Text: Reference] at the end of your response.

Context: {context}

Question: {question}

Answer:`

const QA_PROMPT = new PromptTemplate({
  template,
  inputVariables: ['context', 'question'],
})

const chain = loadQAStuffChain(model, { prompt: QA_PROMPT })

export const qaChain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
  returnSourceDocuments: true,
  chain,
})


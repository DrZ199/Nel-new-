-- Create chat_sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  citations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES chat_sessions (id),
  FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- Create nelson_chunks table
CREATE TABLE nelson_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536)
);

-- Create a function to match documents
CREATE OR REPLACE FUNCTION match_documents(query_embedding VECTOR(1536), match_threshold FLOAT, match_count INT)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nelson_chunks.id,
    nelson_chunks.content,
    nelson_chunks.metadata,
    1 - (nelson_chunks.embedding <=> query_embedding) AS similarity
  FROM nelson_chunks
  WHERE 1 - (nelson_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY nelson_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


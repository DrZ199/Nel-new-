-- Enable the pgvector extension
create extension if not exists vector;

-- Create tables
create table public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.chat_sessions not null,
  user_id uuid references auth.users not null,
  role text not null,
  content text not null,
  citations jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.nelson_chunks (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  metadata jsonb,
  embedding vector(1536)
);

-- Create function to match documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    nelson_chunks.id,
    nelson_chunks.content,
    nelson_chunks.metadata,
    1 - (nelson_chunks.embedding <=> query_embedding) as similarity
  from nelson_chunks
  where 1 - (nelson_chunks.embedding <=> query_embedding) > match_threshold
  order by nelson_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Set up RLS policies
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "Users can view their own chat sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);


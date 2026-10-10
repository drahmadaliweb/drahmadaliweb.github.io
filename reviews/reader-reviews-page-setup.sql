-- Reader Reviews / পাঠকের ভাবনা
-- Uses the existing public.book_reviews table. No second reviews table is created.

alter table public.book_reviews
  add column if not exists ai_translation_consent boolean;

create or replace function public.get_reader_reviews()
returns table(
  id bigint,
  book_id text,
  book_title text,
  name text,
  review text,
  review_en text,
  review_original text,
  source_language text,
  created_at timestamptz,
  source text,
  source_url text,
  source_date date
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.id,
    r.book_id,
    r.book_title,
    r.name,
    r.review,
    r.review_en,
    r.review_original,
    r.source_language,
    r.created_at,
    r.source,
    r.source_url,
    r.source_date
  from public.book_reviews r
  where r.approved = true
  order by r.id;
$$;

revoke all on function public.get_reader_reviews() from public;
grant execute on function public.get_reader_reviews() to anon, authenticated;

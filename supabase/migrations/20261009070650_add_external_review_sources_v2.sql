
alter table public.book_reviews
  add column if not exists source text not null default 'website',
  add column if not exists source_url text,
  add column if not exists external_review_id text,
  add column if not exists review_en text;

alter table public.book_reviews
  drop constraint if exists book_reviews_source_check;
alter table public.book_reviews
  add constraint book_reviews_source_check
  check (source in ('website','rokomari'));

create unique index if not exists book_reviews_external_source_uidx
  on public.book_reviews (source, external_review_id)
  where external_review_id is not null;

drop function if exists public.get_book_reviews(text);

create function public.get_book_reviews(p_book_id text)
returns table(
  id bigint,
  name text,
  review text,
  review_en text,
  created_at timestamptz,
  source text,
  source_url text,
  external_review_id text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.id,
    r.name,
    r.review,
    r.review_en,
    r.created_at,
    r.source,
    r.source_url,
    r.external_review_id
  from public.book_reviews r
  where r.book_id=p_book_id and r.approved=true
  order by r.created_at desc,r.id desc;
$$;

revoke all on function public.get_book_reviews(text) from public;
grant execute on function public.get_book_reviews(text) to anon, authenticated;
;

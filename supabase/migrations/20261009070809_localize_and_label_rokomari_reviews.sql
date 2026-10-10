
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
  with req as (
    select lower(coalesce((current_setting('request.headers', true)::jsonb ->> 'referer'),'')) as referer
  )
  select
    r.id,
    r.name,
    case
      when r.source='rokomari' and (select referer from req) like '%/bn/%'
        then r.review || E'\n\nমূলত Rokomari-তে প্রকাশিত'
      when r.source='rokomari'
        then coalesce(nullif(r.review_en,''),r.review) || E'\n\nOriginally posted on Rokomari'
      else r.review
    end as review,
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

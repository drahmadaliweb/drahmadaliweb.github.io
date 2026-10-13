-- Add automatic duplicate-review flagging to public.book_reviews.
-- Duplicates are never blocked; later matching rows are only flagged.

alter table public.book_reviews
  add column if not exists is_duplicate boolean not null default false;

comment on column public.book_reviews.is_duplicate is
  'True when this row is a later duplicate of another review from the same reviewer, for the same book, with the same normalized original submitted content. Duplicates are flagged but never blocked.';

create or replace function public.book_review_person_key(
  p_name text,
  p_email text
)
returns text
language sql
immutable
as $$
  select case
    when nullif(trim(coalesce(p_email, '')), '') is not null
      then 'email:' || lower(trim(p_email))
    else
      'name:' || lower(regexp_replace(trim(coalesce(p_name, '')), '\\s+', ' ', 'g'))
  end;
$$;

create or replace function public.normalize_book_review_text(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(trim(coalesce(value, '')), '\\s+', ' ', 'g');
$$;

create or replace function public.book_review_duplicate_content_key(
  p_source_language text,
  p_review text,
  p_review_en text,
  p_review_original text
)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_source_language, '') = 'mixed'
      then public.normalize_book_review_text(p_review)
           || E'\\x1f'
           || public.normalize_book_review_text(p_review_en)
    else public.normalize_book_review_text(
      coalesce(nullif(p_review_original, ''), p_review)
    )
  end;
$$;

create or replace function public.refresh_book_review_duplicate_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  with ranked as (
    select
      id,
      (
        row_number() over (
          partition by
            book_id,
            public.book_review_person_key(name, email),
            public.book_review_duplicate_content_key(
              source_language,
              review,
              review_en,
              review_original
            )
          order by id
        ) > 1
      ) as should_be_duplicate
    from public.book_reviews
  )
  update public.book_reviews as br
  set is_duplicate = ranked.should_be_duplicate
  from ranked
  where br.id = ranked.id
    and br.is_duplicate is distinct from ranked.should_be_duplicate;

  return null;
end;
$$;

drop trigger if exists refresh_book_review_duplicate_flags_after_change
on public.book_reviews;

create trigger refresh_book_review_duplicate_flags_after_change
after insert or delete or update of
  book_id,
  name,
  email,
  review,
  review_en,
  review_original,
  source_language
on public.book_reviews
for each statement
execute function public.refresh_book_review_duplicate_flags();

with ranked as (
  select
    id,
    (
      row_number() over (
        partition by
          book_id,
          public.book_review_person_key(name, email),
          public.book_review_duplicate_content_key(
            source_language,
            review,
            review_en,
            review_original
          )
        order by id
      ) > 1
    ) as should_be_duplicate
  from public.book_reviews
)
update public.book_reviews as br
set is_duplicate = ranked.should_be_duplicate
from ranked
where br.id = ranked.id
  and br.is_duplicate is distinct from ranked.should_be_duplicate;

-- Change duplicate-review detection to:
-- duplicate = same book AND (same person OR same content)
--
-- More explicitly, a later review is flagged when EITHER is true:
--   1) same reviewer + same book
--   2) same submitted content + same book
--
-- Reviews are never blocked or deleted. The earliest matching row stays false;
-- later matching rows are marked is_duplicate = true.

create or replace function public.refresh_book_review_duplicate_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.book_reviews as br
  set is_duplicate = exists (
    select 1
    from public.book_reviews as prev
    where prev.id < br.id
      and prev.book_id = br.book_id
      and (
        public.book_review_person_key(prev.name, prev.email)
          = public.book_review_person_key(br.name, br.email)
        or
        public.book_review_duplicate_content_key(
          prev.source_language,
          prev.review,
          prev.review_en,
          prev.review_original
        )
          = public.book_review_duplicate_content_key(
              br.source_language,
              br.review,
              br.review_en,
              br.review_original
            )
      )
  )
  where br.is_duplicate is distinct from exists (
    select 1
    from public.book_reviews as prev
    where prev.id < br.id
      and prev.book_id = br.book_id
      and (
        public.book_review_person_key(prev.name, prev.email)
          = public.book_review_person_key(br.name, br.email)
        or
        public.book_review_duplicate_content_key(
          prev.source_language,
          prev.review,
          prev.review_en,
          prev.review_original
        )
          = public.book_review_duplicate_content_key(
              br.source_language,
              br.review,
              br.review_en,
              br.review_original
            )
      )
  );

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

-- Backfill existing rows using the new OR rule.
update public.book_reviews as br
set is_duplicate = exists (
  select 1
  from public.book_reviews as prev
  where prev.id < br.id
    and prev.book_id = br.book_id
    and (
      public.book_review_person_key(prev.name, prev.email)
        = public.book_review_person_key(br.name, br.email)
      or
      public.book_review_duplicate_content_key(
        prev.source_language,
        prev.review,
        prev.review_en,
        prev.review_original
      )
        = public.book_review_duplicate_content_key(
            br.source_language,
            br.review,
            br.review_en,
            br.review_original
          )
    )
)
where br.is_duplicate is distinct from exists (
  select 1
  from public.book_reviews as prev
  where prev.id < br.id
    and prev.book_id = br.book_id
    and (
      public.book_review_person_key(prev.name, prev.email)
        = public.book_review_person_key(br.name, br.email)
      or
      public.book_review_duplicate_content_key(
        prev.source_language,
        prev.review,
        prev.review_en,
        prev.review_original
      )
        = public.book_review_duplicate_content_key(
            br.source_language,
            br.review,
            br.review_en,
            br.review_original
          )
    )
);

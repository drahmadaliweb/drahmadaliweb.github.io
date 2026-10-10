
alter table public.book_reviews
  add column if not exists review_original text,
  add column if not exists source_language text;

alter table public.book_reviews
  drop constraint if exists book_reviews_source_language_check;

alter table public.book_reviews
  add constraint book_reviews_source_language_check
  check (source_language is null or source_language in ('bn','en','mixed'));
;

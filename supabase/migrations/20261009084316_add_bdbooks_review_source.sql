
alter table public.book_reviews
  drop constraint if exists book_reviews_source_check;

alter table public.book_reviews
  add constraint book_reviews_source_check
  check (source in ('website','rokomari','facebook','bdbooks'));
;

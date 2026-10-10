
alter table public.book_reviews
  drop constraint if exists book_reviews_review_check;

alter table public.book_reviews
  add constraint book_reviews_review_check
  check (char_length(review) between 2 and 10000);
;

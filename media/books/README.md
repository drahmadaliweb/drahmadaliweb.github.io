# Book media

Use one folder per book ID, for example:

```
media/books/usulul-iman-vol-1/
  preview.pdf
  full-book.pdf
  01-introduction.mp3
  02-chapter-one.mp3
```

Then edit that book's file in `/books/` and set the corresponding URLs in `media.preview`, `media.pdf`, or `media.audio`.

The website hides media buttons when the URL is empty. You may also use full external URLs for large PDF or audio files.

// Copy this file, rename it (for example: my-book-title.mjs), and fill in what is known.
// After commit, GitHub Actions rebuilds books-manifest.js automatically.
export default {
  id: 'unique-book-id',
  order: 999,               // controls catalog ordering
  status: 'published',      // 'published' | 'forthcoming'
  rokomariId: '',           // optional
  category: 'Fiqh & Law',
  series: null,             // 'bidat' | 'usulul-iman' | 'zubdatul-bayan' | null
  rokomariUrl: '',          // optional: shown only inside the detail page
  links: [
    // { label: 'Publisher', labelBn: 'প্রকাশক', url: 'https://...' }
  ],
  en: {
    title: 'English title',
    originalTitle: 'বাংলা মূল শিরোনাম',
    subtitle: '',
    summary: ''
  },
  bn: {
    title: 'বাংলা শিরোনাম',
    subtitle: '',
    summary: ''
  },
  meta: {
    publisher: '',
    publisherBn: '',
    publicationYear: '',
    isbn: '',
    edition: '',
    editionBn: '',
    pages: '',
    binding: '',
    bindingBn: '',
    country: '',
    countryBn: '',
    language: '',
    languageBn: ''
  },
  media: {
    // Local path or full external URL.
    cover: null,
    preview: null,
    pdf: null,
    // [{ title: 'Chapter 1', titleBn: 'অধ্যায় ১', url: 'media/books/unique-book-id/01.mp3' }]
    audio: []
  }
};

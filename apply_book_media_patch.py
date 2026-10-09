from pathlib import Path

root = Path.cwd()

# 1) Update headings/containers in English and Bengali detail pages.
repls = {
    root/'book.html': [
        ('<section class="book-media-panel reveal" hidden="" id="bookMedia"><h2>Read &amp; listen</h2><div id="bookAudio"></div></section>',
         '<section class="book-media-panel reveal" hidden="" id="bookMedia"><h2>Digital Access</h2><div class="book-media-links" id="bookMediaLinks"></div><div id="bookAudio"></div></section>')
    ],
    root/'bn'/'book.html': [
        ('<section class="book-media-panel reveal" hidden="" id="bookMedia"><h2>পাঠ ও শ্রবণ</h2><div id="bookAudio"></div></section>',
         '<section class="book-media-panel reveal" hidden="" id="bookMedia"><h2>ডিজিটাল অ্যাক্সেস</h2><div class="book-media-links" id="bookMediaLinks"></div><div id="bookAudio"></div></section>')
    ]
}

for path, pairs in repls.items():
    s = path.read_text()
    for old, new in pairs:
        if old not in s:
            raise SystemExit(f'Expected block not found in {path}')
        s = s.replace(old, new, 1)
    path.write_text(s)

# 2) Move Preview/PDF/Audiobook out of the top action buttons and into Digital Access.
p = root/'book-library.js'
s = p.read_text()
old_actions = """      const m=book.media||{};\n      if(m.preview){const a=document.createElement('a');a.className='btn secondary';a.href=asset(m.preview);a.target='_blank';a.rel='noopener';a.textContent=copy.openPreview;actions.appendChild(a);}\n      if(m.pdf){const a=document.createElement('a');a.className='btn secondary';a.href=asset(m.pdf);a.target='_blank';a.rel='noopener';a.textContent=copy.readPdf;actions.appendChild(a);}\n      if(Array.isArray(m.audio)&&m.audio.some(t=>t?.url)){const a=document.createElement('a');a.className='btn secondary';a.href='#audio';a.textContent=copy.listen;actions.appendChild(a);}\n"""
new_actions = """      const m=book.media||{};\n"""
if old_actions not in s:
    raise SystemExit('Top media-action block not found in book-library.js')
s = s.replace(old_actions, new_actions, 1)

old_media = """    const media=document.getElementById('bookMedia');\n    if(media){\n      const m=book.media||{};const has=Boolean(m.preview||m.pdf||(Array.isArray(m.audio)&&m.audio.some(t=>t?.url)));\n      media.hidden=!has;\n      if(has){\n        const audioHost=document.getElementById('bookAudio');if(audioHost){audioHost.replaceChildren();(m.audio||[]).filter(t=>t?.url).forEach((track,i)=>{\n          const item=document.createElement('div');item.className='audio-track';\n          const label=document.createElement('strong');label.textContent=(isBn?(track.titleBn||track.title):track.title)||`${copy.audio} ${i+1}`;\n          const player=document.createElement('audio');player.controls=true;player.preload='none';player.src=asset(track.url);item.append(label,player);audioHost.appendChild(item);\n        });}\n      }\n    }\n"""
new_media = """    const media=document.getElementById('bookMedia');\n    if(media){\n      const m=book.media||{};const hasAudio=Array.isArray(m.audio)&&m.audio.some(t=>t?.url);const has=Boolean(m.preview||m.pdf||hasAudio);\n      media.hidden=!has;\n      const linksHost=document.getElementById('bookMediaLinks');\n      if(linksHost){\n        linksHost.replaceChildren();\n        if(m.preview){const a=document.createElement('a');a.className='btn secondary';a.href=asset(m.preview);a.target='_blank';a.rel='noopener';a.textContent=copy.openPreview;linksHost.appendChild(a);}\n        if(m.pdf){const a=document.createElement('a');a.className='btn secondary';a.href=asset(m.pdf);a.target='_blank';a.rel='noopener';a.textContent=copy.readPdf;linksHost.appendChild(a);}\n        linksHost.hidden=!linksHost.children.length;\n      }\n      const audioHost=document.getElementById('bookAudio');\n      if(audioHost){\n        audioHost.replaceChildren();\n        (m.audio||[]).filter(t=>t?.url).forEach((track,i)=>{\n          const item=document.createElement('div');item.className='audio-track';\n          const label=document.createElement('strong');label.textContent=(isBn?(track.titleBn||track.title):track.title)||`${copy.audio} ${i+1}`;\n          const player=document.createElement('audio');player.controls=true;player.preload='none';player.src=asset(track.url);item.append(label,player);audioHost.appendChild(item);\n        });\n        audioHost.hidden=!hasAudio;\n      }\n    }\n"""
if old_media not in s:
    raise SystemExit('Book media rendering block not found in book-library.js')
s = s.replace(old_media, new_media, 1)
p.write_text(s)

# 3) Compact media panel styling and avoid stretching an empty/short panel.
p = root/'styles.css'
s = p.read_text()
addition = """\n/* Digital book access */\n.book-spec-panel,.book-media-panel{align-self:start}\n.book-media-links{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 12px}\n.book-media-links[hidden]{display:none}\n.book-media-panel #bookAudio[hidden]{display:none}\n.book-detail-lower:has(.book-media-panel[hidden]){grid-template-columns:1fr}\n"""
if '/* Digital book access */' not in s:
    s += addition
p.write_text(s)

print('Applied Digital Access patch successfully.')

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const storyFiles = import.meta.glob('../stories/**/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const monthDate = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' })

function parseStory(path, raw) {
  const fileName = path.split('/').pop().replace(/\.txt$/, '')
  const fallbackTitle = fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const normalized = raw.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const metadata = {}
  let body = normalized.trim()

  if (match) {
    match[1].split('\n').forEach((line) => {
      const separator = line.indexOf(':')
      if (separator > -1) metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
    })
    body = match[2].trim()
  }

  const tags = (metadata.tags || '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  const words = body.split(/\s+/).filter(Boolean).length

  return {
    slug: metadata.slug || fileName,
    title: metadata.title || fallbackTitle,
    date: metadata.date || '',
    tags,
    excerpt: metadata.excerpt || body.slice(0, 155).replace(/\s+/g, ' ') + (body.length > 155 ? '…' : ''),
    body,
    words,
    minutes: Math.max(1, Math.ceil(words / 220)),
  }
}

const stories = Object.entries(storyFiles)
  .map(([path, raw]) => parseStory(path, raw))
  .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title))

function FontToggle({ enabled, onChange }) {
  return (
    <div className="font-control">
      <span className="font-control-label" id="font-toggle-label">Readable font</span>
      <button className="font-toggle" type="button" role="switch" aria-checked={enabled} aria-labelledby="font-toggle-label" onClick={() => onChange(!enabled)}>
        <span className="font-toggle-knob" />
      </button>
      <span className="tooltip-wrap">
        <button className="tooltip-trigger" type="button" aria-label="About the readable font" onKeyDown={(event) => { if (event.key === 'Escape') event.currentTarget.blur() }}>?</button>
        <span className="tooltip" role="tooltip">Atkinson Hyperlegible uses distinct letter shapes that may make reading easier for people with low vision or dyslexia.</span>
      </span>
    </div>
  )
}

function App() {
  const mainRef = useRef(null)
  const initialSlug = decodeURIComponent(location.hash.replace(/^#\/?/, ''))
  const [activeSlug, setActiveSlug] = useState(initialSlug)
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('All stories')
  const [hyperlegible, setHyperlegible] = useState(() => localStorage.getItem('hyperlegible-font') === 'true')

  useEffect(() => {
    const onHashChange = () => setActiveSlug(decodeURIComponent(location.hash.replace(/^#\/?/, '')))
    addEventListener('hashchange', onHashChange)
    return () => removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    localStorage.setItem('hyperlegible-font', String(hyperlegible))
  }, [hyperlegible])

  const tags = useMemo(() => [...new Set(stories.flatMap((story) => story.tags))].sort(), [])
  const filtered = stories.filter((story) => {
    const haystack = `${story.title} ${story.excerpt} ${story.tags.join(' ')}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (tag === 'All stories' || story.tags.includes(tag))
  })
  const activeStory = stories.find((story) => story.slug === activeSlug)

  useEffect(() => {
    document.title = activeStory ? `${activeStory.title} | Nix's Story Chronicles` : "Nix's Story Chronicles"
    if (activeSlug) mainRef.current?.focus()
  }, [activeSlug, activeStory])

  function openStory(slug) {
    location.hash = `/${encodeURIComponent(slug)}`
    setActiveSlug(slug)
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  function goHome() {
    history.pushState('', document.title, location.pathname + location.search)
    setActiveSlug('')
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  if (activeStory) {
    return (
      <div className={`reader-shell${hyperlegible ? ' hyperlegible' : ''}`}>
        <a className="skip-link" href="#main-content">Skip to story</a>
        <header className="reader-nav" aria-label="Site header">
          <button className="brand button-reset" onClick={goHome}> <span>Nix's Story Chronicles</span></button>
          <nav className="nav-actions" aria-label="Reader navigation">
            <FontToggle enabled={hyperlegible} onChange={setHyperlegible} />
            <button className="back button-reset" onClick={goHome}>← All stories</button>
          </nav>
        </header>
        <main className="reader" id="main-content" ref={mainRef} tabIndex="-1">
          <div className="reader-kicker">{activeStory.tags.join(' · ') || 'A story'}</div>
          <h1>{activeStory.title}</h1>
          <div className="reader-meta">
            {activeStory.date && <span>{monthDate.format(new Date(`${activeStory.date}T12:00:00`))}</span>}
            <span>{activeStory.minutes} min read</span>
            <span>{activeStory.words.toLocaleString()} words</span>
          </div>
          <article>{activeStory.body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</article>
          <footer className="reader-footer">
            <p>Thank you for reading.</p>
            <button onClick={goHome}>Discover another story</button>
          </footer>
        </main>
      </div>
    )
  }

  return (
    <div className={`site-shell${hyperlegible ? ' hyperlegible' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to stories</a>
      <header className="topbar" aria-label="Site header">
        <div className="brand"><span>Nix's Story Chronicles</span></div>
        <nav className="nav-actions" aria-label="Site navigation">
          <FontToggle enabled={hyperlegible} onChange={setHyperlegible} />
          <a href="#collection">Browse the collection ↓</a>
        </nav>
      </header>

      <main id="main-content" ref={mainRef} tabIndex="-1">
        <section className="hero">
          <p className="eyebrow">Original fiction, collected</p>
          <h1>Stories from Nix's<br /><em>personal collection.</em></h1>
          <p className="intro">All minds, all worlds, moments of love and longing, to disappear into and discover.</p>
          <div className="hero-stats"><span>{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span><span>{tags.length} collections</span></div>
        </section>

        <section className="collection" id="collection">
          <div className="section-head">
            <div><p className="eyebrow">The collection</p><h2>Choose a story</h2></div>
            <label className="search"><span aria-hidden="true">⌕</span><span className="sr-only">Search stories by title, description, or tag</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories" /></label>
          </div>

          <div className="tags" aria-label="Filter by tag">
            {['All stories', ...tags].map((item) => <button className={tag === item ? 'active' : ''} aria-pressed={tag === item} onClick={() => setTag(item)} key={item}>{item}</button>)}
          </div>

          <p className="sr-only" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'story' : 'stories'} available</p>

          {filtered.length ? (
            <div className="story-grid">
              {filtered.map((story, index) => (
                <button className="story-card" onClick={() => openStory(story.slug)} aria-label={`Read ${story.title}, ${story.minutes} minute read`} key={story.slug}>
                  <div className="card-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
                  <div className="card-content">
                    <div className="card-tags">{story.tags.map((item) => <span key={item}>{item}</span>)}</div>
                    <h3>{story.title}</h3>
                    <p>{story.excerpt}</p>
                    <div className="card-meta"><span>{story.minutes} min read</span><span className="read-link">Read story <b>→</b></span></div>
                  </div>
                </button>
              ))}
            </div>
          ) : <div className="empty"><span>∅</span><h3>No stories found</h3><p>Try another search or collection.</p></div>}
        </section>
      </main>

      <footer className="site-footer"><p>A growing shelf of original stories.</p><span>Made for slow reading.</span></footer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)

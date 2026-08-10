import React, { useEffect, useMemo, useState } from 'react'
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

function App() {
  const initialSlug = decodeURIComponent(location.hash.replace(/^#\/?/, ''))
  const [activeSlug, setActiveSlug] = useState(initialSlug)
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('All stories')

  useEffect(() => {
    const onHashChange = () => setActiveSlug(decodeURIComponent(location.hash.replace(/^#\/?/, '')))
    addEventListener('hashchange', onHashChange)
    return () => removeEventListener('hashchange', onHashChange)
  }, [])

  const tags = useMemo(() => [...new Set(stories.flatMap((story) => story.tags))].sort(), [])
  const filtered = stories.filter((story) => {
    const haystack = `${story.title} ${story.excerpt} ${story.tags.join(' ')}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (tag === 'All stories' || story.tags.includes(tag))
  })
  const activeStory = stories.find((story) => story.slug === activeSlug)

  function openStory(slug) {
    location.hash = `/${encodeURIComponent(slug)}`
    setActiveSlug(slug)
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goHome() {
    history.pushState('', document.title, location.pathname + location.search)
    setActiveSlug('')
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (activeStory) {
    return (
      <div className="reader-shell">
        <header className="reader-nav">
          <button className="brand button-reset" onClick={goHome}> <span>Nix's Story Chronicles</span></button>
          <button className="back button-reset" onClick={goHome}>← All stories</button>
        </header>
        <main className="reader">
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
    <div className="site-shell">
      <header className="topbar">
        <div className="brand"><span>Nix's Story Chronicles</span></div>
        <a href="#collection">Browse the collection ↓</a>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Original fiction, collected</p>
          <h1>Stories from Nix's<br /><em>personal collection.</em></h1>
          <p className="intro">All minds, all worlds, moments of love and longing, to disappear into and discover.</p>
          <div className="hero-stats"><span>{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span><span>{tags.length} collections</span></div>
        </section>

        <section className="collection" id="collection">
          <div className="section-head">
            <div><p className="eyebrow">The collection</p><h2>Choose a story</h2></div>
            <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories" /></label>
          </div>

          <div className="tags" aria-label="Filter by tag">
            {['All stories', ...tags].map((item) => <button className={tag === item ? 'active' : ''} onClick={() => setTag(item)} key={item}>{item}</button>)}
          </div>

          {filtered.length ? (
            <div className="story-grid">
              {filtered.map((story, index) => (
                <button className="story-card" onClick={() => openStory(story.slug)} key={story.slug}>
                  <div className="card-number">{String(index + 1).padStart(2, '0')}</div>
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

import { useMemo, useState } from 'react'
import './App.css'

const postKey = 'machijikan.ugc'
const saveKey = 'machijikan.saved'

const facilities = [
  { id: 'nakagawa-office', name: '中川区役所 住民窓口', area: '名古屋', category: '役所', waiting: 42, called: 118, windows: 6, status: '混雑', services: ['住民票', '転入転出', '印鑑証明'] },
  { id: 'meieki-clinic', name: '名駅内科クリニック', area: '名古屋', category: '病院', waiting: 28, called: 54, windows: 3, status: '通常', services: ['一般診療', '発熱外来', '健康診断'] },
  { id: 'sakae-shop', name: '栄スマホ修理カウンター', area: '名古屋', category: '店舗', waiting: 16, called: 31, windows: 2, status: 'やや混雑', services: ['画面修理', 'バッテリー交換', '買取相談'] },
  { id: 'shizuoka-bus', name: '静岡駅高速バス案内所', area: '静岡', category: '駅施設', waiting: 9, called: 203, windows: 2, status: '空き', services: ['乗車券', '払い戻し', '忘れ物'] },
]

const spots = [
  { id: 'nakagawa-cafe', facility: 'nakagawa-office', name: '高畑ブックカフェ', type: 'カフェ', walk: 4, stay: 25, price: 520, note: '書類記入と休憩に向く。待ち時間広告との相性が高い。' },
  { id: 'nakagawa-smoke', facility: 'nakagawa-office', name: '区役所前喫煙ブース', type: '喫煙', walk: 2, stay: 8, price: 0, note: '短い待ち時間でも使える施設前スポット。' },
  { id: 'meieki-cafe', facility: 'meieki-clinic', name: '名駅メディカルカフェ', type: 'カフェ', walk: 3, stay: 20, price: 480, note: '診察前後の時間調整に向く。' },
  { id: 'sakae-game', facility: 'sakae-shop', name: '栄ミニゲームスポット', type: 'ゲーム', walk: 6, stay: 20, price: 300, note: '修理待ちの短時間滞在を遊びに変える導線。' },
  { id: 'shizuoka-food', facility: 'shizuoka-bus', name: '駅ナカおにぎりスタンド', type: '飲食', walk: 3, stay: 10, price: 380, note: '乗車前の軽食需要を拾う。' },
]

const revenue = [
  ['周辺店舗広告', '待ち時間に行けるカフェ、喫煙所、飲食、ゲーム、買い物へ送客。'],
  ['番号札・QR導入', '民間施設向けにQR案内、混雑可視化、順番通知を提供。'],
  ['クーポン配信', '待ち時間の長さに応じたクーポン、ニュース、エンタメ枠を表示。'],
  ['確認済み掲載', '施設側が待ち時間、受付時間、休業情報を更新できる有料枠。'],
]

const faqs = [
  ['まち時間ガイドとは？', '役所、病院、店舗、駅施設の待ち時間を見ながら、戻れる範囲の周辺スポットを探すサービスです。'],
  ['UGCで何を集めますか？', '実際の待ち時間、呼び出し状況、混雑、閉店、周辺スポットの使いやすさを集めます。'],
  ['AI向けには何を出しますか？', '施設名、地域、待ち時間、戻り目安、徒歩分、用途、確認状況を簡潔に表示します。'],
]

function readArray(key) {
  try { return JSON.parse(localStorage.getItem(key)) ?? [] } catch { return [] }
}

function yen(value) {
  return value === 0 ? '無料' : new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value)
}

function App() {
  const [query, setQuery] = useState('名古屋')
  const [selectedId, setSelectedId] = useState('nakagawa-office')
  const [ticket, setTicket] = useState(136)
  const [posts, setPosts] = useState(() => readArray(postKey))
  const [saved, setSaved] = useState(() => readArray(saveKey))
  const [form, setForm] = useState({ name: '', memo: '' })

  const filteredFacilities = useMemo(() => {
    const text = query.trim().toLowerCase()
    return facilities.filter((facility) => !text || `${facility.name} ${facility.area} ${facility.category} ${facility.services.join(' ')}`.toLowerCase().includes(text))
  }, [query])
  const selected = facilities.find((facility) => facility.id === selectedId) ?? filteredFacilities[0] ?? facilities[0]
  const estimated = Math.max(Math.round((Math.max(ticket - selected.called, 0) / selected.windows) * 4), selected.waiting)
  const returnBy = Math.max(estimated - 10, 3)
  const recommended = spots.filter((spot) => spot.facility === selected.id && spot.walk * 2 + spot.stay <= returnBy)
  const display = recommended.length ? recommended : spots.filter((spot) => spot.facility === selected.id)

  const submitPost = (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.memo.trim()) return
    const next = [{ ...form, id: crypto.randomUUID(), facility: selected.name, status: '確認待ち', date: new Date().toLocaleDateString('ja-JP') }, ...posts].slice(0, 6)
    setPosts(next)
    localStorage.setItem(postKey, JSON.stringify(next))
    setForm({ name: '', memo: '' })
  }

  const toggleSaved = (id) => {
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id]
    setSaved(next)
    localStorage.setItem(saveKey, JSON.stringify(next))
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div><span className="brand">まち時間ガイド</span><h1>待ち時間を、ただ待たない時間に変える。</h1><p>役所、病院、店舗、駅施設の混雑を見ながら、戻れる範囲のカフェ、喫煙所、飲食、ゲーム、買い物を提案します。</p></div>
        <aside className="answer-box"><span>AI向け要約</span><strong>{selected.name}は現在{selected.status}、推定待ち時間は{estimated}分です。</strong><p>戻り目安は約{returnBy}分。徒歩と滞在時間を合わせて候補を出します。</p></aside>
      </section>

      <section className="search-panel"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="地域・施設・手続きで検索" /><input type="number" min="1" value={ticket} onChange={(event) => setTicket(Number(event.target.value))} /></section>

      <section className="summary-grid">
        <article><span>施設候補</span><strong>{filteredFacilities.length}</strong><p>待ち時間を確認</p></article>
        <article><span>推定待ち</span><strong>{estimated}分</strong><p>番号札から算出</p></article>
        <article><span>戻り目安</span><strong>{returnBy}分</strong><p>余裕を見た外出時間</p></article>
      </section>

      <section className="facility-row">
        {(filteredFacilities.length ? filteredFacilities : facilities).map((facility) => <button key={facility.id} type="button" className={facility.id === selected.id ? 'active' : ''} onClick={() => setSelectedId(facility.id)}>{facility.name}</button>)}
      </section>

      <section className="content-grid">
        {display.map((spot) => (
          <article className="card" key={spot.id}>
            <div className="card-topline"><span>{spot.type}</span><span>徒歩{spot.walk}分</span></div>
            <h2>{spot.name}</h2><p>{spot.note}</p>
            <div className="metric-row"><span>滞在{spot.stay}分</span><span>{yen(spot.price)}</span><strong>{spot.walk * 2 + spot.stay <= returnBy ? '戻れる' : '要注意'}</strong></div>
            <button type="button" onClick={() => toggleSaved(spot.id)}>{saved.includes(spot.id) ? '保存済み' : '保存する'}</button>
          </article>
        ))}
      </section>

      <section className="ugc-section">
        <div><span className="brand">UGC</span><h2>実際の待ち時間・周辺スポットを投稿</h2><p>投稿を施設別FAQ、混雑カレンダー、近隣広告に展開します。</p></div>
        <form className="ugc-form" onSubmit={submitPost}>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="施設・スポット名" />
          <input value={selected.name} readOnly />
          <input value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} placeholder="待ち時間・混雑・おすすめ" />
          <button type="submit">投稿する</button>
        </form>
        <div className="post-grid">{posts.length === 0 && <p className="empty-text">まだ投稿はありません。最初の待ち時間メモを投稿できます。</p>}{posts.map((post) => <article key={post.id}><span>{post.status}</span><h3>{post.name}</h3><p>{post.memo}</p><small>{post.facility} / {post.date}</small></article>)}</div>
      </section>

      <section className="growth-grid">
        <div className="revenue-panel"><h2>収益導線</h2>{revenue.map(([title, text]) => <article key={title}><strong>{title}</strong><p>{text}</p></article>)}</div>
        <div className="buzz-panel"><h2>バズ施策</h2><ul><li>待ち時間別「何分ならどこへ行ける？」記事</li><li>役所・病院・修理待ちのリアル投稿</li><li>QR番号札と周辺クーポンの組み合わせ</li><li>混雑しない時間帯ランキング</li></ul></div>
      </section>

      <section className="seo-section"><div className="answer-box"><h2>まち時間ガイドは、待ち時間と周辺スポットを同時に見せ、施設利用者の外出と消費を生みます。</h2><p>待ち時間、戻り目安、徒歩分、投稿情報を構造化し、検索とAI回答の両方に最適化します。</p></div><div className="faq-grid">{faqs.map(([q, a]) => <article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>
    </main>
  )
}

export default App

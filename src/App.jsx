import { useMemo, useState } from 'react'
import './App.css'

const ticketKey = 'wait-time-guide.ticket'
const savedKey = 'wait-time-guide.savedSpots'

const facilities = [
  {
    id: 'nakagawa-office',
    name: '中川区 住民窓口',
    area: '名古屋',
    station: '高畑',
    category: '役所',
    waiting: 42,
    called: 118,
    windowCount: 6,
    status: '混雑',
    nextUpdate: '3分後',
    services: ['住民票', '転入転出', '印鑑証明', 'マイナンバー'],
  },
  {
    id: 'meieki-clinic',
    name: '名駅内科クリニック',
    area: '名古屋',
    station: '名古屋',
    category: '病院',
    waiting: 28,
    called: 54,
    windowCount: 3,
    status: '通常',
    nextUpdate: '5分後',
    services: ['一般診療', '発熱外来', '健康診断'],
  },
  {
    id: 'sakae-shop',
    name: '栄スマホ修理カウンター',
    area: '名古屋',
    station: '栄',
    category: '店舗',
    waiting: 16,
    called: 31,
    windowCount: 2,
    status: 'やや混雑',
    nextUpdate: '2分後',
    services: ['画面修理', 'バッテリー交換', '買取相談'],
  },
  {
    id: 'shizuoka-bus',
    name: '静岡駅高速バス案内所',
    area: '静岡',
    station: '静岡',
    category: '駅施設',
    waiting: 9,
    called: 203,
    windowCount: 2,
    status: '空き',
    nextUpdate: '1分後',
    services: ['乗車券', '払い戻し', '忘れ物'],
  },
]

const spots = [
  { id: 'nakagawa-cafe', facility: 'nakagawa-office', name: '高畑ブックカフェ', type: 'カフェ', walk: 4, stay: 25, price: 520, fit: '書類記入と休憩' },
  { id: 'nakagawa-smoke', facility: 'nakagawa-office', name: '区役所前喫煙ブース', type: '喫煙', walk: 2, stay: 8, price: 0, fit: '短い待ち時間' },
  { id: 'nakagawa-food', facility: 'nakagawa-office', name: '昼定食 まちの食堂', type: '飲食', walk: 7, stay: 35, price: 900, fit: '40分以上の待ち' },
  { id: 'meieki-cafe', facility: 'meieki-clinic', name: '名駅メディカルカフェ', type: 'カフェ', walk: 3, stay: 20, price: 480, fit: '診察前の時間調整' },
  { id: 'meieki-pharmacy', facility: 'meieki-clinic', name: '駅前ドラッグストア', type: '買い物', walk: 5, stay: 15, price: 0, fit: '処方前の買い物' },
  { id: 'sakae-game', facility: 'sakae-shop', name: '栄ミニゲームスポット', type: 'ゲーム', walk: 6, stay: 20, price: 300, fit: '修理待ち' },
  { id: 'sakae-smoke', facility: 'sakae-shop', name: '地下街喫煙所', type: '喫煙', walk: 4, stay: 8, price: 0, fit: '番号直前でも戻れる' },
  { id: 'shizuoka-food', facility: 'shizuoka-bus', name: '駅南おにぎりスタンド', type: '飲食', walk: 3, stay: 10, price: 380, fit: '乗車前の軽食' },
  { id: 'shizuoka-shop', facility: 'shizuoka-bus', name: '静岡みやげ小径', type: '買い物', walk: 5, stay: 12, price: 1000, fit: '短時間の買い物' },
]

const categories = ['すべて', '役所', '病院', '店舗', '駅施設']
const spotTypes = ['すべて', 'カフェ', '喫煙', '飲食', '買い物', 'ゲーム']

function readObject(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function formatYen(value) {
  return value === 0
    ? '無料'
    : new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0,
      }).format(value)
}

function App() {
  const [query, setQuery] = useState('名古屋')
  const [category, setCategory] = useState('すべて')
  const [spotType, setSpotType] = useState('すべて')
  const [selectedFacilityId, setSelectedFacilityId] = useState('nakagawa-office')
  const [ticket, setTicket] = useState(() => readObject(ticketKey, { number: 136, buffer: 10 }))
  const [saved, setSaved] = useState(() => readObject(savedKey, {}))

  const filteredFacilities = useMemo(() => {
    const text = query.trim().toLowerCase()
    return facilities.filter((facility) => {
      const matchesCategory = category === 'すべて' || facility.category === category
      const haystack = `${facility.name} ${facility.area} ${facility.station} ${facility.services.join(' ')}`.toLowerCase()
      return matchesCategory && (!text || haystack.includes(text))
    })
  }, [category, query])

  const selectedFacility =
    facilities.find((facility) => facility.id === selectedFacilityId) ?? filteredFacilities[0] ?? facilities[0]

  const turnDelta = Math.max(ticket.number - selectedFacility.called, 0)
  const estimatedMinutes = Math.max(Math.round((turnDelta / Math.max(selectedFacility.windowCount, 1)) * 4), selectedFacility.waiting)
  const returnByMinutes = Math.max(estimatedMinutes - ticket.buffer, 3)

  const recommendedSpots = useMemo(() => {
    return spots
      .filter((spot) => spot.facility === selectedFacility.id)
      .filter((spot) => spotType === 'すべて' || spot.type === spotType)
      .filter((spot) => spot.walk * 2 + spot.stay <= returnByMinutes)
      .sort((a, b) => a.walk - b.walk || a.price - b.price)
  }, [returnByMinutes, selectedFacility.id, spotType])

  const fallbackSpots = spots.filter((spot) => spot.facility === selectedFacility.id)
  const displaySpots = recommendedSpots.length ? recommendedSpots : fallbackSpots

  const saveTicket = (nextTicket) => {
    setTicket(nextTicket)
    localStorage.setItem(ticketKey, JSON.stringify(nextTicket))
  }

  const toggleSaved = (spotId) => {
    setSaved((current) => {
      const next = { ...current, [spotId]: !current[spotId] }
      localStorage.setItem(savedKey, JSON.stringify(next))
      return next
    })
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <span className="brand">Wait Time Guide</span>
          <h1>待ち時間を、ただ待たない時間に変える。</h1>
          <p>役所・病院・店舗の混雑状況を見ながら、呼び出しに間に合う周辺スポットを提案します。</p>
        </div>
        <aside className="qr-panel" aria-label="QR番号案内">
          <span>QR ticket</span>
          <strong>No. {ticket.number}</strong>
          <p>呼び出し {selectedFacility.called} 番まで進行中。戻り目安は約 {returnByMinutes} 分以内です。</p>
        </aside>
      </header>

      <section className="control-band" aria-label="施設検索">
        <label>
          地域・駅・施設
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例: 名古屋、高畑、病院" />
        </label>
        <label>
          施設カテゴリ
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          周辺スポット
          <select value={spotType} onChange={(event) => setSpotType(event.target.value)}>
            {spotTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="facility-grid" aria-label="施設一覧">
        {(filteredFacilities.length ? filteredFacilities : facilities).map((facility) => (
          <button
            className={facility.id === selectedFacility.id ? 'facility-card active' : 'facility-card'}
            type="button"
            key={facility.id}
            onClick={() => setSelectedFacilityId(facility.id)}
          >
            <span>{facility.category} / {facility.station}駅</span>
            <strong>{facility.name}</strong>
            <small>{facility.status} / 待ち {facility.waiting}分 / 次回更新 {facility.nextUpdate}</small>
          </button>
        ))}
      </section>

      <section className="dashboard-grid">
        <aside className="ticket-panel">
          <h2>自分の番号</h2>
          <label>
            整理券番号
            <input
              type="number"
              min="1"
              value={ticket.number}
              onChange={(event) => saveTicket({ ...ticket, number: Number(event.target.value) })}
            />
          </label>
          <label>
            余裕時間
            <input
              type="number"
              min="3"
              max="30"
              value={ticket.buffer}
              onChange={(event) => saveTicket({ ...ticket, buffer: Number(event.target.value) })}
            />
          </label>
          <div className="stat-stack">
            <article>
              <span>推定待ち</span>
              <strong>{estimatedMinutes}分</strong>
            </article>
            <article>
              <span>戻り目安</span>
              <strong>{returnByMinutes}分</strong>
            </article>
            <article>
              <span>窓口数</span>
              <strong>{selectedFacility.windowCount}</strong>
            </article>
          </div>
        </aside>

        <section className="spot-list" aria-label="周辺提案">
          <div className="section-heading">
            <span className="brand">Nearby plan</span>
            <h2>{selectedFacility.name} の待ち時間で行ける場所</h2>
          </div>
          {displaySpots.map((spot) => (
            <article className="spot-card" key={spot.id}>
              <div>
                <span className="type-pill">{spot.type}</span>
                <h3>{spot.name}</h3>
                <p>{spot.fit}</p>
              </div>
              <div className="spot-metrics">
                <span>徒歩 {spot.walk}分</span>
                <span>滞在 {spot.stay}分</span>
                <span>{formatYen(spot.price)}</span>
              </div>
              <div className="spot-actions">
                <button type="button" onClick={() => toggleSaved(spot.id)}>
                  {saved[spot.id] ? '保存済み' : '保存する'}
                </button>
                <a href={`https://www.google.com/maps/search/${encodeURIComponent(`${selectedFacility.area} ${spot.name}`)}`} target="_blank" rel="noreferrer">
                  地図で開く
                </a>
              </div>
            </article>
          ))}
        </section>

        <aside className="flow-panel">
          <h2>呼び出しまでの動き</h2>
          <div className="timeline">
            <article>
              <span>いま</span>
              <strong>{selectedFacility.status}</strong>
              <small>{selectedFacility.services.join(' / ')}</small>
            </article>
            <article>
              <span>{Math.max(returnByMinutes - 5, 1)}分後</span>
              <strong>施設へ戻る準備</strong>
              <small>QR画面と番号を確認</small>
            </article>
            <article>
              <span>{returnByMinutes}分後</span>
              <strong>施設に戻る</strong>
              <small>呼び出し前の余裕 {ticket.buffer}分</small>
            </article>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App

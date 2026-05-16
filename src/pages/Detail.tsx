import { Link, useNavigate, useParams } from 'react-router-dom'
import { computeSettlement, formatRupees } from '../lib/settlement'
import { getTransaction } from '../lib/storage'

export default function Detail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const tx = id ? getTransaction(id) : undefined

  const result =
    tx && tx.participants.length > 0 ? computeSettlement(tx.participants) : null

  if (!tx) {
    return (
      <div className="page">
        <header className="header header-row">
          <Link className="link-back" to="/home">
            ← Home
          </Link>
        </header>
        <main className="main">
          <p className="muted">This transaction was not found.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
            Go home
          </button>
        </main>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="page">
        <header className="header header-row">
          <Link className="link-back" to="/home">
            ← Home
          </Link>
        </header>
        <main className="main">
          <p className="muted">This transaction has no people to split between.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
            Go home
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="header header-row header-split">
        <Link className="link-back" to="/home">
          ← Home
        </Link>
        <Link className="btn-edit" to={`/transaction/${tx.id}/edit`}>
          Edit
        </Link>
      </header>

      <main className="main">
        <h2 className="detail-title">{tx.name}</h2>
        <p className="muted detail-meta">
          Total pool {formatRupees(result.total)} · {result.sharePerPersonNote}
        </p>

        <h3 className="subsection-title">Paid vs fair share</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Person</th>
                <th className="num">Paid</th>
                <th className="num">Share</th>
                <th className="num">+ / −</th>
              </tr>
            </thead>
            <tbody>
              {result.balances.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="person-cell">
                      <span className="person-name">{b.name}</span>
                      {b.note ? <span className="person-note">{b.note}</span> : null}
                    </div>
                  </td>
                  <td className="num">{formatRupees(b.paid)}</td>
                  <td className="num">{formatRupees(b.share)}</td>
                  <td className="num">
                    {b.balance === 0 ? (
                      '—'
                    ) : b.balance > 0 ? (
                      <span className="pos">+{formatRupees(b.balance)}</span>
                    ) : (
                      <span className="neg">{formatRupees(b.balance)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="subsection-title">Suggested transfers</h3>
        {result.transfers.length === 0 ? (
          <p className="muted">Everyone is already square for this split.</p>
        ) : (
          <ol className="transfers">
            {result.transfers.map((t, i) => (
              <li key={`${t.fromId}-${t.toId}-${i}`} className="transfer-card">
                <p className="transfer-line">
                  <span className="transfer-from">{t.fromName}</span>
                  <span className="transfer-arrow"> → </span>
                  <span className="transfer-to">{t.toName}</span>
                </p>
                <p className="transfer-amt">{formatRupees(t.amount)}</p>
              </li>
            ))}
          </ol>
        )}

        <p className="hint">
          Positive balance means that person should <strong>receive</strong> money; negative
          means they should <strong>pay</strong> others.
        </p>
      </main>
    </div>
  )
}

export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ds-bg, #06111F)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#0094FF',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          margin: '0 auto 12px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>読み込み中...</div>
      </div>
    </div>
  )
}

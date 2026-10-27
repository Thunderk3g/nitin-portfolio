export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite" style={{ opacity: 0.65 }}>
      <div
        style={{
          height: 28,
          width: 200,
          borderRadius: 6,
          background: "rgba(244, 239, 230, 0.08)",
          marginBottom: 10,
        }}
      />
      <div
        style={{
          height: 16,
          width: 320,
          borderRadius: 4,
          background: "rgba(244, 239, 230, 0.05)",
          marginBottom: 24,
        }}
      />
      <div className="adm-cards">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="adm-card"
            style={{ minHeight: 110, background: "rgba(244, 239, 230, 0.03)" }}
          />
        ))}
      </div>
    </div>
  );
}

import { C } from '@utils/constants';

export default function Leaderboard({ userId, user }) {
  return (
    <div style={{ padding: "28px 32px", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{
        fontSize: "24px",
        fontWeight: "800",
        color: C.t1,
        letterSpacing: "-0.8px",
        marginBottom: "12px"
      }}>
        Leaderboard
      </h1>
      <p style={{ color: C.t2, fontSize: "14px", marginBottom: "24px" }}>
        Global rankings and competition
      </p>
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        padding: "48px 24px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚧</div>
        <p style={{ color: C.t2, fontSize: "14px" }}>
          Global leaderboard coming soon! Compete with users worldwide and climb the ranks.
        </p>
      </div>
    </div>
  );
}

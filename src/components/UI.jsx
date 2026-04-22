import { C } from '@utils/constants';

export const Av = ({ initials, size = 32, isYou }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: isYou ? C.accent : C.surface,
    border: `2px solid ${isYou ? C.accent : C.border}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: isYou ? C.accentFg : C.t2,
    fontSize: size * 0.35, fontWeight: "700", flexShrink: 0,
    fontFamily: "'JetBrains Mono',monospace"
  }}>
    {initials}
  </div>
);

export const Tag = ({ label, color }) => (
  <span style={{
    padding: "2px 8px", borderRadius: "4px", fontSize: "11px",
    fontWeight: "700", letterSpacing: "0.5px",
    background: `${color}22`, color, border: `1px solid ${color}44`,
    fontFamily: "'JetBrains Mono',monospace"
  }}>
    {label}
  </span>
);

export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(6px)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "14px", width: "100%", maxWidth: "500px",
        maxHeight: "88vh", overflow: "auto"
      }}>
        <div style={{
          padding: "18px 22px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <span style={{ color: C.t1, fontSize: "15px", fontWeight: "800", letterSpacing: "-0.3px" }}>
            {title}
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C.t3,
            cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "0 4px"
          }}>×</button>
        </div>
        <div style={{ padding: "22px" }}>{children}</div>
      </div>
    </div>
  );
};

export const FInput = ({ label, value, onChange, placeholder, type = "text", as = "input" }) => {
  const st = {
    width: "100%", background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: "8px", padding: "9px 13px", color: C.t1,
    fontSize: "14px", outline: "none", fontFamily: "inherit",
    resize: as === "textarea" ? "vertical" : undefined,
    minHeight: as === "textarea" ? "72px" : undefined
  };
  return (
    <div style={{ marginBottom: "14px" }}>
      {label && (
        <label style={{
          display: "block", color: C.t2, fontSize: "11px",
          fontWeight: "700", marginBottom: "5px",
          textTransform: "uppercase", letterSpacing: "1px"
        }}>
          {label}
        </label>
      )}
      {as === "textarea" ? (
        <textarea style={st} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} style={st} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
};

export const FSelect = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: "14px" }}>
    {label && (
      <label style={{
        display: "block", color: C.t2, fontSize: "11px",
        fontWeight: "700", marginBottom: "5px",
        textTransform: "uppercase", letterSpacing: "1px"
      }}>
        {label}
      </label>
    )}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: "8px", padding: "9px 13px", color: C.t1,
      fontSize: "14px", outline: "none", fontFamily: "inherit", cursor: "pointer"
    }}>
      {options.map(o => (
        <option key={o.value || o} value={o.value || o}>
          {o.label || o}
        </option>
      ))}
    </select>
  </div>
);

export const Btn = ({ children, onClick, v = "def", sm, style: xSt, disabled }) => {
  const base = {
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none", borderRadius: "8px", fontWeight: "700",
    fontFamily: "inherit", transition: "opacity 0.15s",
    opacity: disabled ? 0.45 : 1,
    fontSize: sm ? "12px" : "13px",
    padding: sm ? "5px 12px" : "9px 18px"
  };
  const vs = {
    def: { background: C.surface, color: C.t1, border: `1px solid ${C.border}` },
    accent: { background: C.accent, color: C.accentFg },
    danger: { background: "transparent", color: C.danger, border: `1px solid #3d1a1a` },
    ghost: { background: "transparent", color: C.t2 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...vs[v], ...xSt }}>
      {children}
    </button>
  );
};

export const StatCard = ({ label, value, sub, accent, icon }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: "12px", padding: "18px 20px", flex: 1, minWidth: "120px"
  }}>
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: "10px"
    }}>
      <span style={{
        color: C.t3, fontSize: "11px", fontWeight: "700",
        textTransform: "uppercase", letterSpacing: "1px"
      }}>
        {label}
      </span>
      <span style={{ fontSize: "18px" }}>{icon}</span>
    </div>
    <div style={{
      fontFamily: "'JetBrains Mono',monospace",
      fontSize: "26px", fontWeight: "700",
      color: accent || C.t1, lineHeight: 1
    }}>
      {value}
    </div>
    {sub && <div style={{ color: C.t3, fontSize: "12px", marginTop: "5px" }}>{sub}</div>}
  </div>
);

import { C } from '@utils/constants';
import { getLevelInfo } from '@utils/helpers';
import { Av } from '@components/UI';

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "tasks", label: "Tasks", icon: "◎" },
  { id: "analytics", label: "Analytics", icon: "◈" },
];

export const Sidebar = ({ page, setPage, user, onLogout, isMobile, onClose }) => {
  const li = getLevelInfo(user?.score || 0);

  const sidebarStyle = {
    width: isMobile ? "100%" : "210px",
    background: C.surface,
    borderRight: isMobile ? "none" : `1px solid ${C.border}`,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100vh",
    overflow: "hidden",
    position: isMobile ? "fixed" : "relative",
    top: 0,
    left: 0,
    zIndex: 100
  };

  const handleNavClick = (id) => {
    setPage(id);
    if (isMobile && onClose) onClose();
  };

  return (
    <aside style={sidebarStyle}>
      <div style={{ padding: "22px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: "20px", fontWeight: "700",
          color: C.accent, letterSpacing: "-1px"
        }}>
          NEXUS
        </div>
        <div style={{
          color: C.t3, fontSize: "11px", marginTop: "2px",
          fontWeight: "600", letterSpacing: "1.5px"
        }}>
          PRODUCTIVITY OS
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px", overflow: "auto" }}>
        {NAV.map(n => {
          const active = page === n.id;
          return (
            <button
              key={n.id}
              onClick={() => handleNavClick(n.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: "10px", padding: "9px 10px", borderRadius: "8px",
                background: active ? C.accentGlow : "transparent",
                border: "none", cursor: "pointer", marginBottom: "2px",
                transition: "background 0.15s", textAlign: "left"
              }}
            >
              <span style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: "16px", color: active ? C.accent : C.t3,
                width: "20px", textAlign: "center"
              }}>
                {n.icon}
              </span>
              <span style={{
                fontSize: "13px", fontWeight: active ? "700" : "500",
                color: active ? C.t1 : C.t2, letterSpacing: "-0.1px"
              }}>
                {n.label}
              </span>
              {active && (
                <div style={{
                  marginLeft: "auto", width: "3px", height: "3px",
                  borderRadius: "50%", background: C.accent
                }} />
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <Av initials={user?.avatar || "U"} size={34} isYou />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: C.t1, fontSize: "13px", fontWeight: "700",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {user?.name || "User"}
            </div>
            <div style={{
              color: C.accent, fontSize: "11px",
              fontFamily: "'JetBrains Mono',monospace", fontWeight: "600"
            }}>
              Lv.{li.lvl} {li.name}
            </div>
          </div>
        </div>
        <div style={{
          background: C.bg, borderRadius: "4px",
          height: "4px", overflow: "hidden"
        }}>
          <div style={{
            height: "100%", width: `${li.progress * 100}%`,
            background: C.accent, borderRadius: "4px",
            transition: "width 0.4s ease"
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{
            color: C.t3, fontSize: "10px",
            fontFamily: "'JetBrains Mono',monospace"
          }}>
            {user?.score || 0} XP
          </span>
          <span style={{
            color: C.t3, fontSize: "10px",
            fontFamily: "'JetBrains Mono',monospace"
          }}>
            {li.next} next
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", marginTop: "10px",
            padding: "6px", background: "transparent",
            border: `1px solid ${C.border}`, borderRadius: "6px",
            color: C.t3, fontSize: "11px", cursor: "pointer",
            fontFamily: "inherit", fontWeight: "600"
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

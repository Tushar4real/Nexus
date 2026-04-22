import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useFirestore } from '@hooks/useFirestore';
import { C, CAT_COLORS, BADGE_DEFS } from '@utils/constants';
import { getLevelInfo } from '@utils/helpers';
import { StatCard } from '@components/UI';

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "12px"
    }}>
      <div style={{ color: C.t2, marginBottom: "4px" }}>{label}</div>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            color: p.color || C.accent,
            fontFamily: "'JetBrains Mono',monospace",
            fontWeight: "700"
          }}
        >
          {p.value}
        </div>
      ))}
    </div>
  );
};

export default function Analytics({ userId, user }) {
  const { data: tasks } = useFirestore('tasks', userId);
  const li = getLevelInfo(user.score || 0);

  const catBreakdown = useMemo(() => {
    const map = {};
    tasks.filter(t => t.status === "Completed").forEach(t => {
      map[t.category] = (map[t.category] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      fill: CAT_COLORS[name] || C.t2
    }));
  }, [tasks]);

  const dailyData = useMemo(() => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const count = tasks.filter(t =>
        t.status === "Completed" && t.completedAt === dateStr
      ).length;
      data.push({
        day: `${d.getMonth() + 1}/${d.getDate()}`,
        tasks: count
      });
    }
    return data;
  }, [tasks]);

  const ChartCard = ({ title, children, height = 220 }) => (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: "12px",
      padding: "18px 20px"
    }}>
      <h3 style={{
        color: C.t2,
        fontSize: "13px",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginBottom: "16px"
      }}>
        {title}
      </h3>
      <div style={{ height }}>{children}</div>
    </div>
  );

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          fontSize: "24px",
          fontWeight: "800",
          color: C.t1,
          letterSpacing: "-0.8px"
        }}>
          Analytics
        </h1>
        <p style={{ color: C.t2, fontSize: "13px", marginTop: "2px" }}>
          Track your productivity trends and performance
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "14px",
        marginBottom: "24px"
      }}>
        <StatCard
          label="Total Score"
          value={(user.score || 0).toLocaleString()}
          accent={C.accent}
          icon="⚡"
        />
        <StatCard
          label="Current Level"
          value={`${li.lvl}`}
          sub={li.name}
          accent={C.purple}
          icon="🏅"
        />
        <StatCard
          label="Completion Rate"
          value={`${Math.round(
            (tasks.filter(t => t.status === "Completed").length /
              Math.max(1, tasks.length)) *
              100
          )}%`}
          icon="📊"
        />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        marginBottom: "20px"
      }}>
        <ChartCard title="Daily Tasks (14 days)" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: C.t3, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: C.t3, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="tasks" fill={C.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category Breakdown">
          <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
            {catBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={catBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {catBreakdown.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, paddingLeft: "10px" }}>
                  {catBreakdown.map(c => (
                    <div
                      key={c.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px"
                      }}
                    >
                      <div style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "2px",
                        background: c.fill,
                        flexShrink: 0
                      }} />
                      <span style={{ color: C.t2, fontSize: "12px", flex: 1 }}>
                        {c.name}
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        color: C.t1,
                        fontSize: "12px",
                        fontWeight: "700"
                      }}>
                        {c.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                width: "100%",
                textAlign: "center",
                color: C.t3,
                fontSize: "13px"
              }}>
                Complete tasks to see category breakdown
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        padding: "18px 20px"
      }}>
        <h3 style={{
          color: C.t2,
          fontSize: "13px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "16px"
        }}>
          Badges Earned
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "8px"
        }}>
          {BADGE_DEFS.map(b => {
            const earned = b.check({
              completed: user.completed || 0,
              streak: user.streak || 0,
              hardTasks: user.hardTasks || 0,
              score: user.score || 0,
              posts: user.posts || 0
            });
            return (
              <div
                key={b.id}
                style={{
                  padding: "10px 12px",
                  background: earned ? C.accentGlow : C.surface,
                  borderRadius: "8px",
                  border: `1px solid ${earned ? C.accent + "44" : C.border}`,
                  opacity: earned ? 1 : 0.4,
                  display: "flex",
                  gap: "8px",
                  alignItems: "center"
                }}
              >
                <span style={{ fontSize: "20px" }}>{b.icon}</span>
                <div>
                  <div style={{
                    color: earned ? C.t1 : C.t2,
                    fontSize: "12px",
                    fontWeight: "700"
                  }}>
                    {b.name}
                  </div>
                  <div style={{ color: C.t3, fontSize: "11px" }}>{b.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

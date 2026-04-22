import { useState, useMemo, useEffect } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@config/firebase';
import { useFirestore } from '@hooks/useFirestore';
import { C, DIFF_COLOR, CAT_COLORS, CATEGORIES, DIFFICULTIES } from '@utils/constants';
import { calcTaskScore, todayStr, relDate, overdue, dFwd } from '@utils/helpers';
import { Btn, Tag, Modal, FInput, FSelect } from '@components/UI';

const TaskCard = ({ task, onComplete, onDelete, onEdit }) => {
  const done = task.status === "Completed";
  const od = !done && overdue(task.deadline);

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${od ? C.danger + "55" : done ? C.success + "33" : C.border}`,
      borderRadius: "10px",
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      opacity: done ? 0.72 : 1
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "10px"
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "4px"
          }}>
            <span style={{
              color: done ? C.t3 : C.t1,
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: done ? "line-through" : "none"
            }}>
              {task.title}
            </span>
            {od && <Tag label="OVERDUE" color={C.danger} />}
            {done && <Tag label="✓ DONE" color={C.success} />}
          </div>
          {task.desc && (
            <p style={{ color: C.t3, fontSize: "12px", margin: 0 }}>
              {task.desc}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {!done && (
            <Btn
              v="ghost"
              sm
              onClick={() => onEdit(task)}
              style={{ color: C.t3, padding: "4px 8px" }}
            >
              ✎
            </Btn>
          )}
          <Btn
            v="ghost"
            sm
            onClick={() => onDelete(task.id)}
            style={{ color: C.danger, padding: "4px 8px" }}
          >
            ✕
          </Btn>
        </div>
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap"
      }}>
        <Tag label={task.difficulty} color={DIFF_COLOR[task.difficulty]} />
        <Tag label={task.category} color={CAT_COLORS[task.category] || C.t2} />
        <span style={{
          color: od ? C.danger : C.t3,
          fontSize: "11px",
          fontFamily: "'JetBrains Mono',monospace",
          marginLeft: "auto"
        }}>
          {relDate(task.deadline)}
        </span>
        {done && task.pointsEarned && (
          <span style={{
            color: C.accent,
            fontSize: "11px",
            fontFamily: "'JetBrains Mono',monospace",
            fontWeight: "700"
          }}>
            +{task.pointsEarned} XP
          </span>
        )}
      </div>
      {!done && (
        <Btn
          v="accent"
          sm
          onClick={() => onComplete(task.id)}
          style={{ alignSelf: "flex-start", marginTop: "2px" }}
        >
          Mark complete
        </Btn>
      )}
    </div>
  );
};

const TaskFormModal = ({ open, onClose, onSave, editing }) => {
  const emptyForm = {
    title: "",
    desc: "",
    difficulty: "Medium",
    category: "Development",
    deadline: dFwd(3)
  };
  const [form, setForm] = useState(editing || emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(editing || emptyForm);
  }, [editing, open]);

  const f = k => v => setForm(p => ({ ...p, [k]: v }));
  const valid = form.title.trim().length > 0;

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Task" : "New Task"}>
      <FInput
        label="Title"
        value={form.title}
        onChange={f("title")}
        placeholder="What needs to be done?"
      />
      <FInput
        label="Description"
        value={form.desc}
        onChange={f("desc")}
        placeholder="Add more detail…"
        as="textarea"
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <FSelect
          label="Difficulty"
          value={form.difficulty}
          onChange={f("difficulty")}
          options={DIFFICULTIES}
        />
        <FSelect
          label="Category"
          value={form.category}
          onChange={f("category")}
          options={CATEGORIES}
        />
      </div>
      <FInput
        label="Deadline"
        value={form.deadline}
        onChange={f("deadline")}
        type="date"
      />
      <div style={{
        display: "flex",
        gap: "10px",
        justifyContent: "flex-end",
        marginTop: "4px"
      }}>
        <Btn onClick={onClose} v="ghost">Cancel</Btn>
        <Btn
          onClick={() => {
            if (valid) {
              onSave(form);
              onClose();
            }
          }}
          v="accent"
          disabled={!valid}
        >
          {editing ? "Save changes" : "Create task"}
        </Btn>
      </div>
    </Modal>
  );
};

export default function Tasks({ userId, user }) {
  const { data: tasks, add, update, remove } = useFirestore('tasks', userId);
  const [filter, setFilter] = useState("All");
  const [diff, setDiff] = useState("All");
  const [cat, setCat] = useState("All");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => tasks.filter(t => {
    if (filter === "Pending" && t.status !== "Pending") return false;
    if (filter === "Completed" && t.status !== "Completed") return false;
    if (diff !== "All" && t.difficulty !== diff) return false;
    if (cat !== "All" && t.category !== cat) return false;
    return true;
  }), [tasks, filter, diff, cat]);

  const cats = ["All", ...new Set(tasks.map(t => t.category))];

  const handleComplete = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === "Completed") return;

    const pts = calcTaskScore(task.difficulty, task.deadline, todayStr());
    await update(id, {
      status: "Completed",
      completedAt: todayStr(),
      pointsEarned: pts
    });

    await updateDoc(doc(db, 'users', userId), {
      score: increment(pts),
      completed: increment(1),
      hardTasks: increment(task.difficulty === "Hard" ? 1 : 0)
    });
  };

  const handleSave = async (form) => {
    if (editing) {
      await update(editing.id, form);
    } else {
      await add({ ...form, status: "Pending" });
    }
    setEditing(null);
  };

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setFilter(id)}
      style={{
        padding: "6px 14px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        background: filter === id ? C.accent : "transparent",
        color: filter === id ? C.accentFg : C.t2,
        fontSize: "13px",
        fontWeight: "600",
        transition: "all 0.15s"
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "800",
            color: C.t1,
            letterSpacing: "-0.8px"
          }}>
            Tasks
          </h1>
          <p style={{ color: C.t2, fontSize: "13px", marginTop: "2px" }}>
            {tasks.filter(t => t.status === "Pending").length} pending ·{" "}
            {tasks.filter(t => t.status === "Completed").length} completed
          </p>
        </div>
        <Btn
          v="accent"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          + New Task
        </Btn>
      </div>

      <div style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "20px",
        alignItems: "center"
      }}>
        <div style={{
          display: "flex",
          gap: "4px",
          background: C.card,
          padding: "4px",
          borderRadius: "8px",
          border: `1px solid ${C.border}`
        }}>
          <Tab id="All" label="All" />
          <Tab id="Pending" label="Pending" />
          <Tab id="Completed" label="Done" />
        </div>
        <select
          value={diff}
          onChange={e => setDiff(e.target.value)}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: "7px 12px",
            color: C.t1,
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "inherit",
            outline: "none"
          }}
        >
          {["All", ...DIFFICULTIES].map(d => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          value={cat}
          onChange={e => setCat(e.target.value)}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            padding: "7px 12px",
            color: C.t1,
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "inherit",
            outline: "none"
          }}
        >
          {cats.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "48px",
            color: C.t3
          }}>
            No tasks match your filters.
          </div>
        )}
        {filtered.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            onComplete={handleComplete}
            onDelete={remove}
            onEdit={task => {
              setEditing(task);
              setModal(true);
            }}
          />
        ))}
      </div>

      <TaskFormModal
        open={modal}
        onClose={() => setModal(false)}
        editing={editing}
        onSave={handleSave}
      />
    </div>
  );
}

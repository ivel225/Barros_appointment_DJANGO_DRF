import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import "./App.css";

const TABS = ["Dashboard", "Patients", "Doctors", "Appointments"];

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("clinic-theme") || "dark");

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ open: false, type: null, item: null });

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, d, a] = await Promise.all([
        api.get("/patients/"),
        api.get("/doctors/"),
        api.get("/appointments/"),
      ]);
      setPatients(api.normalizeList(p));
      setDoctors(api.normalizeList(d));
      setAppointments(api.normalizeList(a));
    } catch (e) {
      showToast(e.message, "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("clinic-theme", theme);
  }, [theme]);

  const filteredPatients = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return patients;
    return patients.filter((x) =>
      `${x.first_name ?? ""} ${x.last_name ?? ""} ${x.email ?? ""}`
        .toLowerCase()
        .includes(s),
    );
  }, [patients, q]);

  const filteredDoctors = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter((x) =>
      `${x.first_name ?? ""} ${x.last_name ?? ""} ${x.specialization ?? ""}`
        .toLowerCase()
        .includes(s),
    );
  }, [doctors, q]);

  const filteredAppointments = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return appointments;
    return appointments.filter((x) =>
      `${x.patient_name ?? ""} ${x.doctor_name ?? ""} ${x.status ?? ""} ${x.reason ?? ""}`
        .toLowerCase()
        .includes(s),
    );
  }, [appointments, q]);

  const openAdd = (type) => setModal({ open: true, type, item: null });
  const openEdit = (type, item) => setModal({ open: true, type, item });
  const closeModal = () => setModal({ open: false, type: null, item: null });

  const saveItem = async (type, values, id) => {
    try {
      if (type === "Patients") {
        if (id) await api.put(`/patients/${id}/`, values);
        else await api.post(`/patients/`, values);
      }
      if (type === "Doctors") {
        if (id) await api.put(`/doctors/${id}/`, values);
        else await api.post(`/doctors/`, values);
      }
      if (type === "Appointments") {
        if (id) await api.put(`/appointments/${id}/`, values);
        else await api.post(`/appointments/`, values);
      }
      showToast("Record saved successfully");
      closeModal();
      await loadAll();
    } catch (e) {
      showToast(e.message, "err");
    }
  };

  const deleteItem = async (type, id) => {
    if (!confirm("Delete this record?")) return;
    try {
      if (type === "Patients") await api.del(`/patients/${id}/`);
      if (type === "Doctors") await api.del(`/doctors/${id}/`);
      if (type === "Appointments") await api.del(`/appointments/${id}/`);
      showToast("Record deleted");
      closeModal();
      await loadAll();
    } catch (e) {
      showToast(e.message, "err");
    }
  };

  const todayAppointments = appointments.filter(
    (item) =>
      (item.appointment_datetime || item.date_time || "")
        .toString()
        .slice(0, 10) === new Date().toISOString().slice(0, 10),
  ).length;

  const activeDoctors = doctors.filter(
    (d) => (d.status || "").toLowerCase() !== "inactive",
  ).length;

  const statusCounts = appointments.reduce(
    (acc, item) => {
      const key = (item.status || "Pending").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { booked: 0, done: 0, cancelled: 0, pending: 0 },
  );

  return (
    <div className={`min-h-screen app-shell ${theme === "light" ? "theme-light text-slate-900" : "text-white"}`}>
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />
      <div className="grid-overlay" />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden lg:flex w-80 flex-col border-r border-white/10 bg-white/5 backdrop-blur-2xl px-6 py-7 shadow-2xl shadow-cyan-950/30">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 shadow-lg shadow-cyan-500/10">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500 pulse-ring flex items-center justify-center text-slate-950 font-black text-lg">
                C
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">
                  Smart Clinic
                </p>
                <h1 className="text-xl font-black leading-tight">Neon Command</h1>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300/80 leading-6">
              Premium management dashboard for patients, doctors, and
              appointments.
            </p>
          </div>

          <nav className="space-y-3">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setQ("");
                }}
                className={`nav-chip ${tab === t ? "nav-chip-active" : "nav-chip-idle"}`}
              >
                <span className="nav-chip-dot" />
                <span>{t}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-8">
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">System status</span>
                <span className="inline-flex items-center gap-2 text-emerald-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(74,222,128,0.95)]" />
                  {loading ? "Syncing" : "Live"}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 ${loading ? "animate-pulse w-2/3" : "w-full"}`} />
              </div>
            </div>

            <div className="glass-panel p-4 text-sm text-slate-300/85 leading-6">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">
                Experience
              </div>
              Glassmorphism cards, neon glow highlights, animated background,
              floating accents, and polished micro-interactions.
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <header className="glass-panel overflow-hidden p-5 md:p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-200/90">
                    admin suite
                  </div>
                  <h2 className="mt-4 text-3xl md:text-4xl font-black tracking-tight">
                    {tab === "Dashboard" ? "Clinic Control Center" : tab}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-300/80">
                    {tab === "Dashboard"
                      ? "Track your clinic operations in one immersive, modern interface."
                      : "Manage records with a clean premium workspace designed for speed and clarity."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
                  <button
                    type="button"
                    onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                    className="theme-toggle-btn"
                    aria-label="Toggle theme"
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    <span className="theme-toggle-icon">{theme === "dark" ? "☀" : "☾"}</span>
                    <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                  </button>
                  {tab !== "Dashboard" && (
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-200/70">
                        ⌕
                      </span>
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={`Search ${tab.toLowerCase()}...`}
                        className="glass-input w-full min-w-[260px] pl-11"
                      />
                    </div>
                  )}
                  {tab !== "Dashboard" && (
                    <button onClick={() => openAdd(tab)} className="primary-btn">
                      <span className="text-lg leading-none">＋</span>
                      <span>Add new</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-auto lg:hidden">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(t);
                      setQ("");
                    }}
                    className={`nav-chip min-w-max ${tab === t ? "nav-chip-active" : "nav-chip-idle"}`}
                  >
                    <span className="nav-chip-dot" />
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </header>

            {tab === "Dashboard" && (
              <section className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard title="Total Patients" value={patients.length} accent="cyan" subtitle="Registered profiles" />
                  <StatCard title="Doctors Online" value={activeDoctors} accent="violet" subtitle="Available providers" />
                  <StatCard title="Appointments" value={appointments.length} accent="emerald" subtitle="Full appointment log" />
                  <StatCard title="Today Queue" value={todayAppointments} accent="amber" subtitle="Scheduled for today" />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
                  <div className="glass-panel p-5 md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold">Live activity overview</h3>
                        <p className="mt-1 text-sm text-slate-300/70">
                          A professional snapshot of the clinic ecosystem.
                        </p>
                      </div>
                      <Tag>Realtime data</Tag>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <InfoPanel
                        title="Patient Base"
                        value={patients.length}
                        text="Growing digital records for every visit and follow-up."
                      />
                      <InfoPanel
                        title="Medical Team"
                        value={doctors.length}
                        text="Keep specialists and status information organized."
                      />
                      <InfoPanel
                        title="Queue Flow"
                        value={appointments.length}
                        text="Monitor booking traffic and appointment completion."
                      />
                    </div>

                    <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4 md:p-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <h4 className="font-semibold">Operational pulse</h4>
                          <p className="text-sm text-slate-400">
                            Visual balance of appointment outcomes.
                          </p>
                        </div>
                        <span className="text-xs rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
                          
                        </span>
                      </div>
                      <div className="space-y-4">
                        <ProgressRow label="Booked" value={statusCounts.booked || 0} total={appointments.length} />
                        <ProgressRow label="Done" value={statusCounts.done || 0} total={appointments.length} />
                        <ProgressRow label="Cancelled" value={statusCounts.cancelled || 0} total={appointments.length} />
                        <ProgressRow label="Pending" value={statusCounts.pending || 0} total={appointments.length} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-panel p-5 md:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-bold">Quick actions</h3>
                        <Tag>Smart workflow</Tag>
                      </div>
                      <div className="mt-5 grid gap-3">
                        <QuickAction title="Add Patient" text="Create a new patient profile instantly." onClick={() => openAdd("Patients")} />
                        <QuickAction title="Add Doctor" text="Register a doctor and specialization." onClick={() => openAdd("Doctors")} />
                        <QuickAction title="Schedule Appointment" text="Book and track a patient consultation." onClick={() => openAdd("Appointments")} />
                      </div>
                    </div>

                    <div className="glass-panel p-5 md:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-bold">Design layer</h3>
                        <Tag>FX enabled</Tag>
                      </div>
                      <ul className="mt-4 space-y-3 text-sm text-slate-300/80">
                        <li>Neon glow borders and glass panels</li>
                        <li>Animated gradient orbs and tactical grid background</li>
                        <li>Professional card spacing, hierarchy, and contrast</li>
                        <li>Premium hover states and floating motion</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {tab === "Patients" && (
              <section className="mt-6">
                <EntitySectionTitle
                  title="Patient Profiles"
                  subtitle="Modern searchable cards with clearer identity and contact details."
                  count={filteredPatients.length}
                />
                <ListGrid
                  items={filteredPatients}
                  empty="No patients yet."
                  render={(p) => (
                    <RecordCard
                      key={p.id}
                      title={`${p.last_name}, ${p.first_name}`}
                      subtitle={`${p.gender || "Unknown"} • ${p.contact_no || "No contact"}`}
                      meta={p.email || "No email available"}
                      tag={`PT-${p.id}`}
                      onClick={() => openEdit("Patients", p)}
                    >
                      <DataPill>{p.address || "No address recorded"}</DataPill>
                    </RecordCard>
                  )}
                />
              </section>
            )}

            {tab === "Doctors" && (
              <section className="mt-6">
                <EntitySectionTitle
                  title="Doctor Directory"
                  subtitle="A polished specialist directory with futuristic card presentation."
                  count={filteredDoctors.length}
                />
                <ListGrid
                  items={filteredDoctors}
                  empty="No doctors yet."
                  render={(d) => (
                    <RecordCard
                      key={d.id}
                      title={`${d.last_name}, ${d.first_name}`}
                      subtitle={d.specialization || "No specialization"}
                      meta={`${d.contact_no || "No contact"} • ${d.email || "No email"}`}
                      tag={`DR-${d.id}`}
                      onClick={() => openEdit("Doctors", d)}
                    >
                      <DataPill>{d.status || "Status not set"}</DataPill>
                    </RecordCard>
                  )}
                />
              </section>
            )}

            {tab === "Appointments" && (
              <section className="mt-6">
                <EntitySectionTitle
                  title="Appointments Timeline"
                  subtitle="Track scheduled consultations with cleaner status visibility."
                  count={filteredAppointments.length}
                />
                <ListGrid
                  items={filteredAppointments}
                  empty="No appointments yet."
                  render={(a) => (
                    <RecordCard
                      key={a.id}
                      title={`${a.patient_name || `Patient#${a.patient}`} → ${a.doctor_name || `Doctor#${a.doctor}`}`}
                      subtitle={a.appointment_datetime || a.date_time || "No datetime set"}
                      meta={a.reason || "No reason provided"}
                      tag={`AP-${a.id}`}
                      onClick={() => openEdit("Appointments", a)}
                    >
                      <DataPill>{a.status || "Pending"}</DataPill>
                    </RecordCard>
                  )}
                />
              </section>
            )}
          </div>
        </main>
      </div>

      {modal.open && (
        <EditModal
          type={modal.type}
          item={modal.item}
          patients={patients}
          doctors={doctors}
          onClose={closeModal}
          onSave={saveItem}
          onDelete={deleteItem}
        />
      )}

      {toast && (
        <div className={`toast-pop ${toast.type === "ok" ? "toast-ok" : "toast-err"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, accent = "cyan" }) {
  const accentClass = {
    cyan: "border-cyan-300/20",
    violet: "border-violet-300/20",
    emerald: "border-emerald-300/20",
    amber: "border-amber-300/20",
  }[accent];

  const topGlow = {
    cyan: "from-cyan-300/30 via-cyan-400/10 to-transparent",
    violet: "from-violet-300/30 via-fuchsia-400/10 to-transparent",
    emerald: "from-emerald-300/30 via-emerald-400/10 to-transparent",
    amber: "from-amber-300/30 via-orange-400/10 to-transparent",
  }[accent];

  return (
    <div className={`glass-panel group min-h-[172px] overflow-hidden p-6 md:p-7 ${accentClass}`}>
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-60 pointer-events-none ${topGlow}`} />
      <div className="relative flex h-full items-start justify-between gap-4">
        <div className="min-w-0 pr-2">
          <p className="text-sm font-medium text-slate-300/80 truncate">{title}</p>
          <div className="mt-4 text-5xl leading-none font-black tracking-tight glow-number md:text-6xl">
            {value}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
        <div className="shrink-0 h-14 w-14 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center text-cyan-200 text-xl group-hover:-translate-y-1 transition duration-300">
          ✦
        </div>
      </div>
    </div>
  );
}

function EntitySectionTitle({ title, subtitle, count }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h3 className="text-2xl font-black tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-slate-300/70">{subtitle}</p>
      </div>
      <Tag>{count} visible</Tag>
    </div>
  );
}

function ListGrid({ items, empty, render }) {
  if (!items.length) {
    return (
      <div className="glass-panel p-10 text-center text-slate-300/75">
        <div className="text-4xl mb-3">◎</div>
        <div className="text-lg font-semibold">{empty}</div>
        <div className="mt-2 text-sm text-slate-400">
          Try adding a record or changing your search term.
        </div>
      </div>
    );
  }
  return <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{items.map(render)}</div>;
}

function RecordCard({ title, subtitle, meta, tag, onClick, children }) {
  return (
    <button onClick={onClick} className="record-card text-left">
      <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-cyan-300/10 via-transparent to-violet-400/10 opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold leading-snug">{title}</h4>
          <p className="mt-2 text-sm text-slate-300/75">{subtitle}</p>
          <p className="mt-1 text-sm text-slate-400">{meta}</p>
        </div>
        <Tag>{tag}</Tag>
      </div>
      <div className="relative mt-4">{children}</div>
    </button>
  );
}

function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200/85 backdrop-blur-xl">
      {children}
    </span>
  );
}

function DataPill({ children }) {
  return (
    <span className="inline-flex max-w-full rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100/90">
      {children}
    </span>
  );
}

function InfoPanel({ title, value, text }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{title}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <p className="mt-2 text-sm text-slate-300/70 leading-6">{text}</p>
    </div>
  );
}

function ProgressRow({ label, value, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value} • {pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-500 shadow-[0_0_26px_rgba(34,211,238,0.6)] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuickAction({ title, text, onClick }) {
  return (
    <button onClick={onClick} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-left transition duration-300 hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-sm text-slate-300/70">{text}</div>
        </div>
        <span className="text-cyan-200 text-xl">↗</span>
      </div>
    </button>
  );
}

function EditModal({
  type,
  item,
  patients,
  doctors,
  onClose,
  onSave,
  onDelete,
}) {
  const editing = !!item?.id;
  const [v, setV] = useState(() => initialValues(type, item));

  const set = (k, val) => setV((prev) => ({ ...prev, [k]: val }));
  const save = () => onSave(type, cleanPayload(type, v), item?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
      <div className="modal-shell w-full max-w-3xl overflow-hidden">
        <div className="absolute -left-24 top-0 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative border-b border-white/10 px-5 py-5 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100/90">
                {editing ? "Edit record" : "Create record"}
              </div>
              <h3 className="mt-3 text-2xl font-black">
                {editing ? `Edit ${type}` : `Add ${type}`}
              </h3>
              <p className="mt-1 text-sm text-slate-300/75">
                A refined data entry form with premium styling and modern clarity.
              </p>
            </div>
            <button onClick={onClose} className="icon-btn">✕</button>
          </div>
        </div>

        <div className="relative max-h-[72vh] overflow-y-auto px-5 py-5 md:px-6">
          <div className="grid gap-4 md:grid-cols-2">
            {type === "Patients" && (
              <>
                <Input label="First Name" value={v.first_name} onChange={(e) => set("first_name", e.target.value)} />
                <Input label="Last Name" value={v.last_name} onChange={(e) => set("last_name", e.target.value)} />
                <Select
                  label="Gender"
                  value={v.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  options={[
                    { value: "", label: "Select gender..." },
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                  ]}
                />
                <Input type="date" label="Birth Date" value={v.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
                <Input label="Contact No." value={v.contact_no} onChange={(e) => set("contact_no", e.target.value)} />
                <Input label="Email" value={v.email} onChange={(e) => set("email", e.target.value)} />
                <div className="md:col-span-2">
                  <Input label="Address" value={v.address} onChange={(e) => set("address", e.target.value)} />
                </div>
              </>
            )}

            {type === "Doctors" && (
              <>
                <Input label="First Name" value={v.first_name} onChange={(e) => set("first_name", e.target.value)} />
                <Input label="Last Name" value={v.last_name} onChange={(e) => set("last_name", e.target.value)} />
                <Input label="Specialization" value={v.specialization} onChange={(e) => set("specialization", e.target.value)} />
                <Input label="Contact No." value={v.contact_no} onChange={(e) => set("contact_no", e.target.value)} />
                <Input label="Email" value={v.email} onChange={(e) => set("email", e.target.value)} />
                <Select
                  label="Status"
                  value={v.status}
                  onChange={(e) => set("status", e.target.value)}
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                />
              </>
            )}

            {type === "Appointments" && (
              <>
                <Select
                  label="Patient"
                  value={v.patient}
                  onChange={(e) => set("patient", e.target.value)}
                  options={[
                    { value: "", label: "Select patient..." },
                    ...patients.map((p) => ({ value: String(p.id), label: `${p.last_name}, ${p.first_name}` })),
                  ]}
                />
                <Select
                  label="Doctor"
                  value={v.doctor}
                  onChange={(e) => set("doctor", e.target.value)}
                  options={[
                    { value: "", label: "Select doctor..." },
                    ...doctors.map((d) => ({ value: String(d.id), label: `${d.last_name}, ${d.first_name}` })),
                  ]}
                />
                <Input
                  type="datetime-local"
                  label="Appointment Date"
                  value={formatDateTimeLocal(v.appointment_datetime)}
                  onChange={(e) => set("appointment_datetime", e.target.value)}
                />
                <Select
                  label="Status"
                  value={v.status}
                  onChange={(e) => set("status", e.target.value)}
                  options={[
                    { value: "Booked", label: "Booked" },
                    { value: "Completed", label: "Completed" },
                    { value: "Cancelled", label: "Cancelled" },
                  ]}
                />
                <div className="md:col-span-2">
                  <Input label="Reason" value={v.reason} onChange={(e) => set("reason", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Input label="Remarks" value={v.remarks} onChange={(e) => set("remarks", e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative flex flex-wrap justify-end gap-3 border-t border-white/10 px-5 py-5 md:px-6">
          {editing && (
            <button onClick={() => onDelete(type, item.id)} className="danger-btn">
              Delete
            </button>
          )}
          <button onClick={save} className="primary-btn">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-400">{label}</span>
      <input {...props} className={`glass-input ${className}`.trim()} />
    </label>
  );
}

function Select({ label, options, className = "", value = "", onChange, ...props }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));
  const placeholder = options.find((o) => o.value === "")?.label || "Select option...";

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-400">{label}</span>
      <div className={`custom-select-wrap ${className}`.trim()}>
        <button
          type="button"
          className={`glass-input custom-select-trigger ${open ? "custom-select-open" : ""}`.trim()}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={selected?.value !== "" ? "text-white" : "text-slate-400"}>
            {selected?.label || placeholder}
          </span>
          <span className={`custom-select-caret ${open ? "rotate-180" : ""}`}>⌄</span>
        </button>

        <input type="hidden" value={value} {...props} />

        {open && (
          <div className="custom-select-menu" role="listbox" onClick={(e) => e.stopPropagation()}>
            {options.map((o) => {
              const active = String(o.value) === String(value);
              return (
                <button
                  key={String(o.value)}
                  type="button"
                  className={`custom-select-option ${active ? "custom-select-option-active" : ""}`.trim()}
                  onClick={() => {
                    onChange?.({ target: { value: o.value } });
                    setOpen(false);
                  }}
                >
                  <span>{o.label}</span>
                  {active && <span className="custom-select-check">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </label>
  );
}

function initialValues(type, item) {
  if (type === "Patients")
    return {
      first_name: item?.first_name ?? "",
      last_name: item?.last_name ?? "",
      gender: item?.gender ?? "",
      birth_date: item?.birth_date ?? "",
      contact_no: item?.contact_no ?? "",
      email: item?.email ?? "",
      address: item?.address ?? "",
    };

  if (type === "Doctors")
    return {
      first_name: item?.first_name ?? "",
      last_name: item?.last_name ?? "",
      specialization: item?.specialization ?? "",
      contact_no: item?.contact_no ?? "",
      email: item?.email ?? "",
      status: item?.status ?? "",
    };

  return {
    patient: item?.patient ? String(item.patient) : "",
    doctor: item?.doctor ? String(item.doctor) : "",
    appointment_datetime: item?.appointment_datetime ?? item?.date_time ?? "",
    status: item?.status ?? "",
    reason: item?.reason ?? "",
    remarks: item?.remarks ?? "",
  };
}

function cleanPayload(type, v) {
  if (type === "Appointments") {
    return {
      ...v,
      patient: v.patient ? Number(v.patient) : null,
      doctor: v.doctor ? Number(v.doctor) : null,
      appointment_datetime: v.appointment_datetime
        ? new Date(v.appointment_datetime).toISOString()
        : null,
    };
  }
  return v;
}

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

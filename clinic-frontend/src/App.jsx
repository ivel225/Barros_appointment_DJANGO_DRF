import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const TABS = ["Dashboard", "Patients", "Doctors", "Appointments"];

export default function App() {
  const [tab, setTab] = useState("Dashboard");

  // data
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // ui
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // modal
  const [modal, setModal] = useState({ open: false, type: null, item: null });

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
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

  // filtered views
  const filteredPatients = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return patients;
    return patients.filter((x) =>
      `${x.first_name ?? ""} ${x.last_name ?? ""}`.toLowerCase().includes(s),
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
      `${x.patient_name ?? ""} ${x.doctor_name ?? ""} ${x.status ?? ""}`
        .toLowerCase()
        .includes(s),
    );
  }, [appointments, q]);

  // CRUD helpers
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
      showToast("Saved!");
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
      showToast("Deleted!");
      closeModal();
      await loadAll();
    } catch (e) {
      showToast(e.message, "err");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-white/10 bg-slate-900/50 p-5 hidden md:block">
          <div className="text-xl font-extrabold text-sky-400">
            Clinic Admin
          </div>
          <div className="text-xs text-slate-400 mt-1">React + Tailwind</div>

          <nav className="mt-6 space-y-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setQ("");
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition
                  ${tab === t ? "bg-sky-500 text-slate-950 border-sky-400" : "bg-white/5 border-white/10 hover:border-sky-500"}`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="mt-6 text-xs text-slate-400">
            {loading ? "Syncing..." : "Ready"}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {/* Topbar */}
          <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold">{tab}</div>
                <div className="text-xs text-slate-400">
                  {tab === "Dashboard" ? "Overview" : "Manage records"}
                </div>
              </div>

              {tab !== "Dashboard" && (
                <div className="flex items-center gap-2">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search..."
                    className="w-56 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => openAdd(tab)}
                    className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-extrabold hover:opacity-90"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>

            {/* Mobile tabs */}
            <div className="md:hidden mt-3 flex gap-2 overflow-auto">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setQ("");
                  }}
                  className={`px-4 py-2 rounded-xl border whitespace-nowrap
                    ${tab === t ? "bg-sky-500 text-slate-950 border-sky-400" : "bg-white/5 border-white/10"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {tab === "Dashboard" && (
              <div className="grid md:grid-cols-3 gap-4">
                <StatCard title="Patients" value={patients.length} />
                <StatCard title="Doctors" value={doctors.length} />
                <StatCard title="Appointments" value={appointments.length} />
              </div>
            )}

            {tab === "Patients" && (
              <ListGrid
                items={filteredPatients}
                empty="No patients yet."
                render={(p) => (
                  <CardButton onClick={() => openEdit("Patients", p)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-lg">
                          {p.last_name}, {p.first_name}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          {p.gender || "—"} • {p.contact_no || "No contact"}
                        </div>
                        <div className="text-sm text-slate-400">
                          {p.email || "No email"}
                        </div>
                      </div>
                      <Tag>ID: {p.id}</Tag>
                    </div>
                  </CardButton>
                )}
              />
            )}

            {tab === "Doctors" && (
              <ListGrid
                items={filteredDoctors}
                empty="No doctors yet."
                render={(d) => (
                  <CardButton onClick={() => openEdit("Doctors", d)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-lg">
                          {d.last_name}, {d.first_name}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          {d.specialization || "No specialization"}
                        </div>
                        <div className="text-sm text-slate-400">
                          {d.contact_no || "No contact"} •{" "}
                          {d.email || "No email"}
                        </div>
                      </div>
                      <Tag>ID: {d.id}</Tag>
                    </div>
                  </CardButton>
                )}
              />
            )}

            {tab === "Appointments" && (
              <ListGrid
                items={filteredAppointments}
                empty="No appointments yet."
                render={(a) => (
                  <CardButton onClick={() => openEdit("Appointments", a)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-lg">
                          {a.patient_name || `Patient#${a.patient}`} →{" "}
                          {a.doctor_name || `Doctor#${a.doctor}`}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          {a.appointment_datetime ||
                            a.date_time ||
                            "No datetime"}{" "}
                          • {a.status || "—"}
                        </div>
                        <div className="text-sm text-slate-400">
                          {a.reason || "No reason"}
                        </div>
                      </div>
                      <Tag>ID: {a.id}</Tag>
                    </div>
                  </CardButton>
                )}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm border shadow
          ${toast.type === "ok" ? "bg-emerald-600 text-white border-emerald-400/50" : "bg-rose-600 text-white border-rose-400/50"}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-white/10 p-5">
      <div className="text-slate-400 text-sm">{title}</div>
      <div className="text-4xl font-extrabold mt-2">{value}</div>
    </div>
  );
}

function ListGrid({ items, empty, render }) {
  if (!items.length) return <div className="text-slate-400">{empty}</div>;
  return <div className="grid md:grid-cols-2 gap-3">{items.map(render)}</div>;
}

function CardButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl bg-slate-900 border border-white/10 p-5 hover:border-sky-500 transition"
    >
      {children}
    </button>
  );
}

function Tag({ children }) {
  return (
    <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
      {children}
    </span>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-20">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-950 border border-white/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold">
              {editing ? `Edit ${type}` : `Add ${type}`}
            </div>
            <div className="text-xs text-slate-400">
              Fill in the fields then Save
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {type === "Patients" && (
            <>
              <Input
                label="First Name"
                value={v.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
              <Input
                label="Last Name"
                value={v.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
              <Input
                label="Gender"
                value={v.gender}
                onChange={(e) => set("gender", e.target.value)}
                placeholder="Male/Female/Other"
              />
              <Input
                label="Birth Date"
                value={v.birth_date}
                onChange={(e) => set("birth_date", e.target.value)}
                placeholder="YYYY-MM-DD"
              />
              <Input
                label="Contact No."
                value={v.contact_no}
                onChange={(e) => set("contact_no", e.target.value)}
              />
              <Input
                label="Email"
                value={v.email}
                onChange={(e) => set("email", e.target.value)}
              />
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  value={v.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>
            </>
          )}

          {type === "Doctors" && (
            <>
              <Input
                label="First Name"
                value={v.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
              <Input
                label="Last Name"
                value={v.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
              <Input
                label="Specialization"
                value={v.specialization}
                onChange={(e) => set("specialization", e.target.value)}
              />
              <Input
                label="Contact No."
                value={v.contact_no}
                onChange={(e) => set("contact_no", e.target.value)}
              />
              <Input
                label="Email"
                value={v.email}
                onChange={(e) => set("email", e.target.value)}
              />
              <Input
                label="Status"
                value={v.status}
                onChange={(e) => set("status", e.target.value)}
                placeholder="Active/Inactive"
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
                  ...patients.map((p) => ({
                    value: String(p.id),
                    label: `${p.last_name}, ${p.first_name}`,
                  })),
                ]}
              />
              <Select
                label="Doctor"
                value={v.doctor}
                onChange={(e) => set("doctor", e.target.value)}
                options={[
                  { value: "", label: "Select doctor..." },
                  ...doctors.map((d) => ({
                    value: String(d.id),
                    label: `${d.last_name}, ${d.first_name}`,
                  })),
                ]}
              />
              <Input
                label="Appointment DateTime"
                value={v.appointment_datetime}
                onChange={(e) => set("appointment_datetime", e.target.value)}
                placeholder="2026-02-28T14:00:00Z (or your format)"
              />
              <Input
                label="Status"
                value={v.status}
                onChange={(e) => set("status", e.target.value)}
                placeholder="Booked/Done/Cancelled"
              />
              <div className="md:col-span-2">
                <Input
                  label="Reason"
                  value={v.reason}
                  onChange={(e) => set("reason", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Remarks"
                  value={v.remarks}
                  onChange={(e) => set("remarks", e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {editing && (
            <button
              onClick={() => onDelete(type, item.id)}
              className="px-4 py-2 rounded-xl bg-rose-500 text-slate-950 font-extrabold hover:opacity-90"
            >
              Delete
            </button>
          )}
          <button
            onClick={save}
            className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-extrabold hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <input
        {...props}
        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 outline-none focus:border-sky-500"
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <select
        {...props}
        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 outline-none focus:border-sky-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
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

  // Appointments
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
  // Small cleanup so DRF gets what it expects
  if (type === "Appointments") {
    return {
      ...v,
      patient: v.patient ? Number(v.patient) : null,
      doctor: v.doctor ? Number(v.doctor) : null,
      appointment_datetime: v.appointment_datetime || null,
    };
  }
  return v;
}

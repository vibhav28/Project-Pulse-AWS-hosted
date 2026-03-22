import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2, Clock, AlertTriangle, FolderOpen, TrendingUp,
    Plus, X, Calendar, Target, Users, BarChart2, Loader2, RefreshCw, Zap,
    Upload, Database, ToggleLeft, ToggleRight
} from "lucide-react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { apiFetch } from "@/lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── Helpers ────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    done: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "#10b981" },
    in_progress: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", dot: "#3b82f6" },
    todo: { bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/30", dot: "#94a3b8" },
    on_hold: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", dot: "#f59e0b" },
};
const PRIORITY_COLORS = {
    critical: "text-red-400 bg-red-500/15 border-red-500/30",
    high: "text-orange-400 bg-orange-500/15 border-orange-500/30",
    medium: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
    low: "text-slate-400 bg-slate-500/15 border-slate-500/30",
};
const PIE_COLORS = ["#10b981", "#3b82f6", "#94a3b8", "#f59e0b", "#ec4899", "#8b5cf6", "#f97316", "#06b6d4"];

const TODAY_STR = new Date().toISOString().split("T")[0];

const defaultForm = {
    name: "", description: "", status: "in_progress", priority: "medium",
    start_date: TODAY_STR, due_date: "", estimated_days: 7, team_size: 1,
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, subtitle }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border ${color.border} ${color.bg} p-5 flex items-start gap-4`}
        >
            <div className={`rounded-xl p-2.5 ${color.bg} border ${color.border}`}>
                <Icon className={`h-5 w-5 ${color.text}`} />
            </div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className={`text-xs font-medium ${color.text}`}>{label}</p>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
        </motion.div>
    );
}

function Badge({ children, className = "" }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${className}`}>
            {children}
        </span>
    );
}

function ProgressBar({ pct, color = "bg-blue-500" }) {
    return (
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
                className={`h-full ${color} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            />
        </div>
    );
}

// ─── Add / Edit Modal ────────────────────────────────────────────────────────
function ProjectModal({ open, onClose, onSaved, initial }) {
    const [form, setForm] = useState(initial || defaultForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(initial || defaultForm);
        setError("");
    }, [initial, open]);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setError("Project name is required."); return; }
        setSaving(true);
        setError("");
        try {
            const method = initial?.id ? "PUT" : "POST";
            const url = initial?.id
                ? `${API_URL}/projects/${initial.id}/`
                : `${API_URL}/projects/`;
            const res = await apiFetch(url, {
                method,
                body: JSON.stringify({
                    ...form,
                    estimated_days: Number(form.estimated_days),
                    team_size: Number(form.team_size),
                    due_date: form.due_date || null,
                    end_date: form.status === "done" ? (form.end_date || TODAY_STR) : null,
                }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(JSON.stringify(d));
            }
            onSaved();
            onClose();
        } catch (err) {
            setError(err.message || "Failed to save project.");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold">{initial?.id ? "Edit Project" : "New Project"}</h2>
                        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Project Name *</label>
                            <input value={form.name} onChange={set("name")}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20"
                                placeholder="e.g. Redesign Homepage" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                            <textarea value={form.description} onChange={set("description")} rows={2}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                                placeholder="Brief description..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                                <select value={form.status} onChange={set("status")}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20">
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="done">Done</option>
                                    <option value="on_hold">On Hold</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Priority</label>
                                <select value={form.priority} onChange={set("priority")}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Start Date</label>
                                <input type="date" value={form.start_date} onChange={set("start_date")}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Due Date</label>
                                <input type="date" value={form.due_date} onChange={set("due_date")}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Estimated Days</label>
                                <input type="number" min="1" value={form.estimated_days} onChange={set("estimated_days")}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Team Size</label>
                                <input type="number" min="1" value={form.team_size} onChange={set("team_size")}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20" />
                            </div>
                        </div>
                        {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
                        <div className="flex gap-2 pt-1">
                            <button type="button" onClick={onClose}
                                className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {initial?.id ? "Save Changes" : "Create Project"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Custom Pie Label ────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

// ─── JIRA Dataset View ────────────────────────────────────────────────────────
function JiraDatasetView() {
    const [datasets, setDatasets] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [analysis, setAnalysis] = useState(null);
    const [loadingDatasets, setLoadingDatasets] = useState(true);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [error, setError] = useState("");
    const [customCol, setCustomCol] = useState("");
    const [customCol2, setCustomCol2] = useState("");
    const [customData, setCustomData] = useState([]);
    const [customSeries, setCustomSeries] = useState([]);
    const [loadingCustom, setLoadingCustom] = useState(false);

    // Fetch user's uploaded datasets
    useEffect(() => {
        (async () => {
            try {
                const res = await apiFetch(`${API_URL}/datasets/`);
                if (!res.ok) throw new Error("Failed to load datasets");
                const data = await res.json();
                const list = Array.isArray(data) ? data : data.results || [];
                setDatasets(list);
                if (list.length > 0) setSelectedId(list[0].id);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoadingDatasets(false);
            }
        })();
    }, []);

    // Fetch analysis when dataset selection changes
    useEffect(() => {
        if (!selectedId) return;
        setAnalysis(null);
        setError("");
        setLoadingAnalysis(true);
        (async () => {
            try {
                const res = await apiFetch(`${API_URL}/datasets/${selectedId}/analyse/`);
                if (!res.ok) throw new Error("Failed to analyse dataset");
                const data = await res.json();
                setAnalysis(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoadingAnalysis(false);
            }
        })();
    }, [selectedId]);

    // Fetch custom aggregation
    useEffect(() => {
        if (!selectedId || !customCol) {
            setCustomData([]);
            setCustomSeries([]);
            return;
        }
        setLoadingCustom(true);
        (async () => {
            try {
                let url = `${API_URL}/datasets/${selectedId}/aggregate/?column=${encodeURIComponent(customCol)}`;
                if (customCol2) {
                    url += `&column2=${encodeURIComponent(customCol2)}`;
                }
                const res = await apiFetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) {
                        setCustomData(data.data);
                        setCustomSeries(data.series || []);
                    }
                }
            } catch (e) {
                console.error("Custom chart error", e);
            } finally {
                setLoadingCustom(false);
            }
        })();
    }, [selectedId, customCol, customCol2]);

    if (loadingDatasets) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (datasets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <Upload className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No datasets uploaded yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Go to <span className="text-primary font-medium">Upload Dataset</span> to add a JIRA CSV file.
                </p>
            </div>
        );
    }

    // Build chart data from analysis
    const statusPieData = analysis
        ? Object.entries(analysis.status_counts).map(([name, value]) => ({ name, value }))
        : [];

    const priorityBarData = analysis
        ? Object.entries(analysis.priority_counts).map(([name, value]) => ({ name, value }))
        : [];

    const typeBarData = analysis
        ? Object.entries(analysis.type_counts).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <div className="space-y-5">
            {/* Dataset Selector */}
            <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20 min-w-[280px]"
                >
                    {datasets.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.file_name} {d.row_count ? `(${d.row_count.toLocaleString()} rows)` : ""}
                        </option>
                    ))}
                </select>
                {loadingAnalysis && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {analysis && !loadingAnalysis && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                            label="Total Issues"
                            value={analysis.total_rows.toLocaleString()}
                            icon={FolderOpen}
                            color={{ bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" }}
                        />
                        {/* Top 3 statuses as cards */}
                        {statusPieData.slice(0, 3).map((s, i) => {
                            const colors = [
                                { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
                                { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
                                { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
                            ];
                            const icons = [CheckCircle2, Clock, AlertTriangle];
                            const Icon = icons[i] || FolderOpen;
                            return (
                                <StatCard
                                    key={s.name}
                                    label={s.name}
                                    value={s.value.toLocaleString()}
                                    icon={Icon}
                                    color={colors[i] || colors[0]}
                                    subtitle={`${((s.value / analysis.total_rows) * 100).toFixed(1)}%`}
                                />
                            );
                        })}
                        {statusPieData.length < 3 && analysis.avg_resolution_days !== null && (
                            <StatCard
                                label="Avg Resolution"
                                value={`${analysis.avg_resolution_days}d`}
                                icon={TrendingUp}
                                color={{ bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" }}
                                subtitle="mean days to resolve"
                            />
                        )}
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Status Pie */}
                        <div className="rounded-2xl border bg-card p-5">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                                Status Distribution
                            </h3>
                            {statusPieData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                                labelLine={false} label={CustomPieLabel} dataKey="value">
                                                {statusPieData.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                                        {statusPieData.map((d, i) => (
                                            <div key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <span className="h-2 w-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                {d.name}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                                    No status column found in CSV
                                </div>
                            )}
                        </div>

                        {/* Priority Bar */}
                        <div className="rounded-2xl border bg-card p-5">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                                Priority Breakdown
                            </h3>
                            {priorityBarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={priorityBarData} barSize={20}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                        <Bar dataKey="value" name="Issues" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                                    No priority column found in CSV
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Issue Type + Resolution time */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Issue Type bar */}
                        {typeBarData.length > 0 && (
                            <div className="rounded-2xl border bg-card p-5">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                                    Issue Type Breakdown
                                </h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={typeBarData} barSize={20}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                        <Bar dataKey="value" name="Issues" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Resolution time card */}
                        {analysis.avg_resolution_days !== null && (
                            <div className="rounded-2xl border bg-card p-5 flex flex-col justify-center items-center text-center">
                                <div className="rounded-xl bg-violet-500/10 p-3 mb-3">
                                    <TrendingUp className="h-5 w-5 text-violet-400" />
                                </div>
                                <p className="text-3xl font-bold text-violet-400">{analysis.avg_resolution_days}d</p>
                                <p className="text-sm font-medium mt-1">Average Resolution Time</p>
                                <p className="text-xs text-muted-foreground mt-1">mean days from created to resolved</p>
                            </div>
                        )}
                    </div>

                    {/* Custom Chart Generator */}
                    <div className="rounded-2xl border bg-card p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Custom Chart Generator
                            </h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">Group by:</span>
                                    <select 
                                        value={customCol}
                                        onChange={(e) => setCustomCol(e.target.value)}
                                        className="rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/20 max-w-[150px]"
                                    >
                                        <option value="">-- Main Column --</option>
                                        {analysis.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">Compare with:</span>
                                    <select 
                                        value={customCol2}
                                        onChange={(e) => setCustomCol2(e.target.value)}
                                        className="rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/20 max-w-[150px]"
                                    >
                                        <option value="">-- None --</option>
                                        {analysis.columns.filter(c => c !== customCol).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {loadingCustom ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : customData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={customData} barSize={customCol2 ? 40 : 20} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                    {customSeries.map((s, i) => (
                                        <Bar 
                                            key={s} 
                                            dataKey={s} 
                                            name={s} 
                                            fill={customCol2 ? PIE_COLORS[i % PIE_COLORS.length] : "#ec4899"} 
                                            stackId={customCol2 ? "a" : undefined}
                                            radius={!customCol2 ? [4, 4, 0, 0] : 0}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                                Select a column to generate a custom chart
                            </div>
                        )}
                    </div>

                    {/* Columns info */}
                    <div className="rounded-2xl border bg-card p-5">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            Dataset Columns <span className="font-normal normal-case">({analysis.columns.length} total)</span>
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {analysis.columns.map((col) => (
                                <span key={col}
                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium
                                        ${col === analysis.status_col ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                                            col === analysis.priority_col ? "bg-violet-500/10 text-violet-400 border-violet-500/30" :
                                                col === analysis.type_col ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                                                    "bg-secondary text-muted-foreground border-transparent"}`}>
                                    {col}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProjectsOverview() {
    const [stats, setStats] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modal, setModal] = useState({ open: false, initial: null });
    const [activeTab, setActiveTab] = useState("overview"); // overview | completed | in_progress
    const [mode, setMode] = useState("projects"); // "projects" | "jira"

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [statsRes, projRes] = await Promise.all([
                apiFetch(`${API_URL}/projects/stats/`),
                apiFetch(`${API_URL}/projects/`),
            ]);
            if (!statsRes.ok || !projRes.ok) throw new Error("Failed to load data");
            const [statsData, projData] = await Promise.all([statsRes.json(), projRes.json()]);
            setStats(statsData);
            setProjects(Array.isArray(projData) ? projData : projData.results || []);
        } catch (e) {
            setError(e.message || "Failed to load projects.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openCreate = () => setModal({ open: true, initial: null });
    const openEdit = (p) => setModal({ open: true, initial: p });
    const closeModal = () => setModal({ open: false, initial: null });

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this project?")) return;
        await apiFetch(`${API_URL}/projects/${id}/`, { method: "DELETE" });
        fetchData();
    };

    // ── Derived chart data ─────────────────────────────────────────────────────
    const pieData = stats
        ? [
            { name: "Completed", value: stats.summary.completed },
            { name: "In Progress", value: stats.summary.in_progress },
            { name: "To Do", value: stats.summary.todo },
            { name: "On Hold", value: stats.summary.on_hold },
        ].filter((d) => d.value > 0)
        : [];

    const barData = stats?.completed_projects?.map((p) => ({
        name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
        Estimated: p.estimated_days,
        Actual: p.actual_days,
    })) || [];

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <div className="border-b px-6 py-4 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-sm font-semibold flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-primary" />
                        Dashboard
                    </h1>
                    <p className="text-xs text-muted-foreground">Track progress and predict delivery times</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Mode toggle */}
                    <div className="flex items-center rounded-lg border bg-background overflow-hidden">
                        <button
                            onClick={() => setMode("projects")}
                            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${mode === "projects" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <FolderOpen className="h-3.5 w-3.5" />
                            My Projects
                        </button>
                        <button
                            onClick={() => setMode("jira")}
                            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${mode === "jira" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Database className="h-3.5 w-3.5" />
                            JIRA Dataset
                        </button>
                    </div>

                    {mode === "projects" && (
                        <>
                            <button onClick={fetchData} disabled={loading}
                                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors flex items-center gap-1.5 text-muted-foreground disabled:opacity-50">
                                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                            <button onClick={openCreate}
                                className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                                <Plus className="h-3.5 w-3.5" />
                                New Project
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* ── JIRA Dataset Mode ─────────────────────────────────────── */}
                {mode === "jira" && <JiraDatasetView />}

                {/* ── My Projects Mode ──────────────────────────────────────── */}
                {mode === "projects" && (
                    loading && !stats ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <p className="text-sm text-destructive mb-2">{error}</p>
                                <button onClick={fetchData} className="text-xs text-primary hover:underline">Try again</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* ── Stat Cards ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <StatCard label="Total Projects" value={stats?.summary.total ?? 0}
                                    icon={FolderOpen}
                                    color={{ bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" }} />
                                <StatCard label="Completed" value={stats?.summary.completed ?? 0}
                                    icon={CheckCircle2}
                                    color={{ bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" }}
                                    subtitle={stats ? `${stats.summary.completion_rate_pct}% rate` : ""} />
                                <StatCard label="In Progress" value={stats?.summary.in_progress ?? 0}
                                    icon={Clock}
                                    color={{ bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" }} />
                                <StatCard label="Overdue" value={stats?.summary.overdue ?? 0}
                                    icon={AlertTriangle}
                                    color={{ bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" }} />
                            </div>

                            {/* ── Tabs ── */}
                            <div className="flex gap-1 border-b">
                                {[
                                    { id: "overview", label: "Overview" },
                                    { id: "in_progress", label: `In Progress (${stats?.summary.in_progress ?? 0})` },
                                    { id: "completed", label: `Completed (${stats?.summary.completed ?? 0})` },
                                ].map((t) => (
                                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                                        className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${activeTab === t.id
                                            ? "border-primary text-primary"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                            }`}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
                            {activeTab === "overview" && (
                                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="rounded-2xl border bg-card p-5">
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Status Distribution</h3>
                                            {pieData.length > 0 ? (
                                                <>
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <PieChart>
                                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                                                labelLine={false} label={CustomPieLabel} dataKey="value">
                                                                {pieData.map((_, i) => (
                                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                                                        {pieData.map((d, i) => (
                                                            <div key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <span className="h-2 w-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                                {d.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No projects yet</div>
                                            )}
                                        </div>
                                        <div className="rounded-2xl border bg-card p-5">
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Estimated vs Actual Days</h3>
                                            {barData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <BarChart data={barData} barSize={14}>
                                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                                        <YAxis tick={{ fontSize: 10 }} />
                                                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                                        <Bar dataKey="Estimated" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">Complete some projects to see comparison</div>
                                            )}
                                        </div>
                                    </div>

                                    {stats?.prediction && (
                                        <div className="rounded-2xl border bg-card p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="rounded-lg bg-primary/10 p-2">
                                                    <Zap className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold">Team Velocity Prediction</h3>
                                                    <p className="text-xs text-muted-foreground">Based on {stats.prediction.sample_size} completed project{stats.prediction.sample_size !== 1 ? "s" : ""} — no external API</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="rounded-xl bg-secondary/60 p-4 text-center">
                                                    <p className="text-2xl font-bold text-primary">
                                                        {stats.prediction.avg_efficiency_ratio !== null
                                                            ? `${(stats.prediction.avg_efficiency_ratio * 100).toFixed(0)}%`
                                                            : "—"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">Efficiency Ratio<br /><span className="text-[10px]">(actual / estimated)</span></p>
                                                </div>
                                                <div className="rounded-xl bg-secondary/60 p-4 text-center">
                                                    <p className="text-2xl font-bold">
                                                        {stats.prediction.avg_actual_days_completed > 0
                                                            ? `${stats.prediction.avg_actual_days_completed}d`
                                                            : "—"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">Avg Days to Complete</p>
                                                </div>
                                                <div className="rounded-xl bg-secondary/60 p-4 text-center">
                                                    <p className="text-2xl font-bold text-blue-400">
                                                        {stats.summary.in_progress > 0 ? `${stats.summary.in_progress}` : "0"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">Active Projects<br /><span className="text-[10px]">being tracked</span></p>
                                                </div>
                                            </div>
                                            {stats.prediction.sample_size === 0 && (
                                                <p className="text-xs text-muted-foreground mt-3 text-center italic">
                                                    Complete your first project to enable velocity predictions.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="rounded-2xl border bg-card p-5">
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">All Projects</h3>
                                        {projects.length === 0 ? (
                                            <div className="py-10 text-center">
                                                <FolderOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">No projects yet.</p>
                                                <button onClick={openCreate} className="mt-3 text-xs text-primary hover:underline">Create your first project →</button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {projects.map((p) => {
                                                    const sc = STATUS_COLORS[p.status] || STATUS_COLORS.todo;
                                                    const pc = PRIORITY_COLORS[p.priority] || PRIORITY_COLORS.medium;
                                                    return (
                                                        <div key={p.id}
                                                            className="flex items-center justify-between rounded-xl px-4 py-3 border bg-secondary/30 hover:bg-secondary/60 transition-colors group">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className={`h-2 w-2 rounded-full shrink-0`} style={{ background: sc.dot }} />
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium truncate">{p.name}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {p.estimated_days}d est · {p.days_elapsed}d elapsed
                                                                        {p.due_date && ` · due ${p.due_date}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                                <Badge className={pc}>{p.priority}</Badge>
                                                                <Badge className={`${sc.bg} ${sc.text} ${sc.border}`}>{p.status.replace("_", " ")}</Badge>
                                                                <button onClick={() => openEdit(p)}
                                                                    className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-foreground transition-all px-2 py-1 rounded-lg hover:bg-accent">
                                                                    Edit
                                                                </button>
                                                                <button onClick={() => handleDelete(p.id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:text-destructive/80 transition-all px-2 py-1 rounded-lg hover:bg-destructive/10">
                                                                    Del
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <button onClick={openCreate} className="w-full mt-2 py-3 border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors group">
                                                    <Plus className="h-5 w-5 mb-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                    <span className="text-xs font-medium">Add another project</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── IN PROGRESS TAB ─────────────────────────────────────── */}
                            {activeTab === "in_progress" && (
                                <motion.div key="in_progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    {stats?.in_progress_projects?.length === 0 && (
                                        <div className="py-16 text-center">
                                            <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No projects currently in progress.</p>
                                            <button onClick={openCreate} className="mt-3 text-xs text-primary hover:underline">Start one →</button>
                                        </div>
                                    )}
                                    {stats?.in_progress_projects?.map((p) => (
                                        <motion.div key={p.id}
                                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                            className={`rounded-2xl border bg-card p-5 ${p.is_overdue ? "border-red-500/30" : ""}`}>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-semibold">{p.name}</h4>
                                                        {p.is_overdue && (
                                                            <Badge className="text-red-400 bg-red-500/15 border-red-500/30">⚠ Overdue</Badge>
                                                        )}
                                                        <Badge className={PRIORITY_COLORS[p.priority]}>{p.priority}</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {p.days_elapsed}d elapsed of {p.estimated_days}d estimated
                                                        {p.due_date && ` · due ${p.due_date}`}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-bold text-blue-400">{p.progress_pct}%</p>
                                                    <p className="text-xs text-muted-foreground">progress</p>
                                                </div>
                                            </div>
                                            <ProgressBar pct={p.progress_pct}
                                                color={p.is_overdue ? "bg-red-500" : p.progress_pct > 75 ? "bg-amber-500" : "bg-blue-500"} />
                                            {p.predicted_remaining_days !== null && (
                                                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                                    <span>
                                                        Predicted remaining:&nbsp;
                                                        <span className="font-semibold text-foreground">
                                                            ~{p.predicted_remaining_days} day{p.predicted_remaining_days !== 1 ? "s" : ""}
                                                        </span>
                                                        <span className="ml-1 text-[10px] text-muted-foreground/60">(based on team velocity)</span>
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {/* ── COMPLETED TAB ────────────────────────────────────────── */}
                            {activeTab === "completed" && (
                                <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    {stats?.completed_projects?.length === 0 && (
                                        <div className="py-16 text-center">
                                            <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No completed projects yet.</p>
                                        </div>
                                    )}
                                    {stats?.completed_projects?.length > 0 && (
                                        <div className="rounded-2xl border bg-card overflow-hidden">
                                            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-secondary/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                <span className="col-span-4">Project</span>
                                                <span className="col-span-2 text-center">Priority</span>
                                                <span className="col-span-2 text-center">Estimated</span>
                                                <span className="col-span-2 text-center">Actual</span>
                                                <span className="col-span-2 text-center">On Time?</span>
                                            </div>
                                            {stats.completed_projects.map((p, i) => (
                                                <motion.div key={p.id}
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    className="grid grid-cols-12 gap-2 px-5 py-4 border-t items-center hover:bg-secondary/30 transition-colors">
                                                    <div className="col-span-4">
                                                        <p className="text-sm font-medium">{p.name}</p>
                                                        {p.end_date && <p className="text-xs text-muted-foreground">Completed {p.end_date}</p>}
                                                    </div>
                                                    <div className="col-span-2 flex justify-center">
                                                        <Badge className={PRIORITY_COLORS[p.priority]}>{p.priority}</Badge>
                                                    </div>
                                                    <div className="col-span-2 text-center text-sm text-muted-foreground">{p.estimated_days}d</div>
                                                    <div className="col-span-2 text-center text-sm font-medium">{p.actual_days}d</div>
                                                    <div className="col-span-2 flex justify-center">
                                                        {p.on_time === null ? (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        ) : p.on_time ? (
                                                            <Badge className="text-emerald-400 bg-emerald-500/15 border-emerald-500/30">✓ On Time</Badge>
                                                        ) : (
                                                            <Badge className="text-red-400 bg-red-500/15 border-red-500/30">Late</Badge>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </>
                    )
                )}
            </div>

            {/* Modal — only relevant in My Projects mode */}
            <ProjectModal
                open={modal.open}
                onClose={closeModal}
                onSaved={fetchData}
                initial={modal.initial}
            />
        </div>
    );
}

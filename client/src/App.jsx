import './index.css';

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-900">
      <div className="max-w-2xl rounded-2xl bg-white p-10 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">College Bus Tracking</p>
        <h1 className="mt-4 text-4xl font-bold">Realtime campus mobility</h1>
        <p className="mt-4 text-lg text-slate-600">
          Monitor buses, track routes, and keep students informed with a role-based dashboard experience.
        </p>
        <div className="mt-8 flex gap-4 flex-wrap">
          <button className="rounded-lg bg-blue-600 px-5 py-3 text-white font-medium">Admin</button>
          <button className="rounded-lg bg-slate-200 px-5 py-3 text-slate-800 font-medium">Driver</button>
          <button className="rounded-lg bg-slate-200 px-5 py-3 text-slate-800 font-medium">Student</button>
        </div>
      </div>
    </main>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthProvider';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [roasterEnabled, setRoasterEnabled] = useState(true);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [users, setUsers] = useState([]);
  const [roastCount, setRoastCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [settingsRes, usersRes, roastsRes] = await Promise.all([
      supabase.from('app_settings').select('*').eq('id', 1).single(),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('roast_results').select('id', { count: 'exact', head: true })
    ]);

    if (settingsRes.data) {
      setRoasterEnabled(settingsRes.data.roaster_enabled);
      setMaintenanceMsg(settingsRes.data.maintenance_message || '');
    }

    if (usersRes.data) setUsers(usersRes.data);
    if (roastsRes.count !== null) setRoastCount(roastsRes.count);

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');

    const { error } = await supabase
      .from('app_settings')
      .update({
        roaster_enabled: roasterEnabled,
        maintenance_message: maintenanceMsg
      })
      .eq('id', 1);

    if (error) {
      setSaveMsg(`Error: ${error.message}`);
    } else {
      setSaveMsg('Settings updated successfully.');
    }

    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin mb-3">
            <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full"></div>
          </div>
          <p className="font-body text-ink-muted text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-paper p-8 shadow-lg my-8">
      {/* Header */}
      <div className="border-b-2 border-double border-ink pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border-2 border-ink-red rounded-full flex items-center justify-center font-display text-sm">
            🔒
          </div>
          <div>
            <div className="text-xs font-body text-ink-muted tracking-wider">CLASSIFIED — AUTHORIZED PERSONNEL ONLY</div>
            <h1 className="text-2xl font-display text-ink">Administrative Control Panel</h1>
            <div className="text-xs font-body text-ink-muted">BUREAU OPERATIONS MANAGEMENT</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-rule p-4 text-center">
          <div className="text-2xl font-display text-ink">{users.length}</div>
          <div className="text-xs font-body text-ink-muted tracking-wider">REGISTERED PERSONNEL</div>
        </div>
        <div className="border border-rule p-4 text-center">
          <div className="text-2xl font-display text-ink">{roastCount}</div>
          <div className="text-xs font-body text-ink-muted tracking-wider">PUBLIC RECORDS</div>
        </div>
      </div>

      {/* Service Toggle */}
      <div className="mb-6">
        <label className="block text-xs font-body text-ink-muted mb-3 tracking-wider">
          SECTION I — SERVICE CONTROL
        </label>
        <div className="border border-rule p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display text-ink text-sm">Resume Evaluation Service</div>
              <div className="text-xs text-ink-muted font-body">
                {roasterEnabled ? '🟢 Currently ACTIVE' : '🔴 Currently SUSPENDED'}
              </div>
            </div>
            <button
              onClick={() => setRoasterEnabled(!roasterEnabled)}
              className={`px-4 py-2 font-display text-sm border-2 transition tracking-wider ${
                roasterEnabled
                  ? 'bg-ink-red/10 border-ink-red text-ink-red hover:bg-ink-red/20'
                  : 'bg-rule/30 border-ink text-ink hover:bg-rule/50'
              }`}
            >
              {roasterEnabled ? 'DISABLE' : 'ENABLE'}
            </button>
          </div>

          <div>
            <label className="block text-xs text-ink-muted mb-1 tracking-wider">
              MAINTENANCE MESSAGE (shown when disabled)
            </label>
            <textarea
              value={maintenanceMsg}
              onChange={(e) => setMaintenanceMsg(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border-2 border-rule bg-paper font-body text-sm text-ink focus:border-ink focus:outline-none transition resize-none"
              placeholder="Enter message to display when service is suspended..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 px-4 py-2 font-display text-ink bg-rule hover:bg-rule/80 disabled:opacity-50 transition border-2 border-ink text-sm tracking-wider"
          >
            {saving ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>

          {saveMsg && (
            <div className={`mt-2 text-xs font-body ${saveMsg.startsWith('Error') ? 'text-ink-red' : 'text-ink-muted'}`}>
              {saveMsg}
            </div>
          )}
        </div>
      </div>

      {/* User List */}
      <div>
        <label className="block text-xs font-body text-ink-muted mb-3 tracking-wider">
          SECTION II — REGISTERED PERSONNEL ROSTER
        </label>
        <div className="border border-rule overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-rule/30 border-b border-rule">
                <th className="text-left px-3 py-2 text-xs font-body text-ink-muted tracking-wider">EMAIL</th>
                <th className="text-left px-3 py-2 text-xs font-body text-ink-muted tracking-wider">NAME</th>
                <th className="text-left px-3 py-2 text-xs font-body text-ink-muted tracking-wider">ROLE</th>
                <th className="text-left px-3 py-2 text-xs font-body text-ink-muted tracking-wider">JOINED</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-rule/50 hover:bg-rule/10 transition">
                  <td className="px-3 py-2 text-xs font-body text-ink">{u.email}</td>
                  <td className="px-3 py-2 text-xs font-body text-ink">{u.display_name}</td>
                  <td className="px-3 py-2 text-xs font-body">
                    <span className={u.role === 'admin' ? 'text-ink-red font-bold' : 'text-ink-muted'}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs font-body text-ink-muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t-2 border-double border-ink text-center">
        <div className="text-xs font-body text-ink-faint tracking-wider">
          ADMINISTRATIVE PANEL — RESTRICTED ACCESS
        </div>
      </div>
    </div>
  );
}

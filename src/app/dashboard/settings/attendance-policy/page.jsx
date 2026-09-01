"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import {
  fetchAttendancePolicy,
  updateAttendancePolicy,
  resetAttendancePolicy,
  timeToMinutes,
  minutesToTime,
  DEFAULT_POLICY
} from "@/lib/attendancePolicyUtils";
import {
  FaClock,
  FaCalendarAlt,
  FaSave,
  FaUndo,
  FaChartLine,
  FaUserClock,
  FaShieldAlt,
  FaInfoCircle,
  FaCheckCircle
} from "react-icons/fa";

export default function AttendancePolicySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [originalPolicy, setOriginalPolicy] = useState(DEFAULT_POLICY);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCreateTableHelp, setShowCreateTableHelp] = useState(false);

  useEffect(() => {
    const loadPolicy = async () => {
      setLoading(true);
      try {
        const fetchedPolicy = await fetchAttendancePolicy();
        setPolicy(fetchedPolicy);
        setOriginalPolicy(fetchedPolicy);
      } catch (e) {
        console.error("Error loading policy:", e);
        showToast("Error", "Failed to load attendance policy", "error");
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, []);

  useEffect(() => {
    const hasChanges = JSON.stringify(policy) !== JSON.stringify(originalPolicy);
    setHasChanges(hasChanges);
  }, [policy, originalPolicy]);

  const handleChange = (field, value) => {
    setPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePolicy = async () => {
    setSaving(true);
    
    try {
      const result = await updateAttendancePolicy(policy);
      
      if (result.success) {
        showToast("Policy Saved", result.message, "success");
        setOriginalPolicy({ ...policy });
        setHasChanges(false);
      } else {
        showToast("Save Failed", result.error || "Failed to save policy", "error");
      }
    } catch (e) {
      showToast("Error", e.message || "Failed to save policy", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPolicy = async () => {
    if (!confirm("Are you sure you want to reset the policy to default settings?")) {
      return;
    }

    try {
      const result = await resetAttendancePolicy();
      
      if (result.success) {
        setPolicy(DEFAULT_POLICY);
        setOriginalPolicy(DEFAULT_POLICY);
        showToast("Policy Reset", result.message, "success");
      } else {
        showToast("Reset Failed", result.error || "Failed to reset policy", "error");
      }
    } catch (e) {
      showToast("Error", e.message || "Failed to reset policy", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3 text-[#0F172A]">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-[#64748B]">Loading Attendance Policy Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
              Attendance Settings
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1.5 flex items-center gap-2.5">
            <FaShieldAlt className="text-[#2563EB]" />
            <span>Attendance Policy Settings</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure attendance timeline for employees and students. Changes apply immediately.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetPolicy}
            disabled={saving || !hasChanges}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaUndo className="text-sm" /> Reset Default
          </button>
          <button
            type="button"
            onClick={handleSavePolicy}
            disabled={saving || !hasChanges}
            className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <FaSave className="text-xs" /> {saving ? "Saving..." : "Save Policy"}
          </button>
        </div>
      </div>

      {/* Current Policy Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FaInfoCircle className="text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#0F172A]">Current Attendance Policy</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">Policy Name</span>
            <input
              type="text"
              value={policy.policy_name}
              onChange={(e) => handleChange("policy_name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm font-semibold text-[#0F172A]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">Shift Start Time</span>
            <input
              type="text"
              value={policy.shift_start}
              onChange={(e) => handleChange("shift_start", e.target.value)}
              placeholder="10:00 AM"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm font-semibold text-[#0F172A]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">Shift End Time</span>
            <input
              type="text"
              value={policy.shift_end}
              onChange={(e) => handleChange("shift_end", e.target.value)}
              placeholder="6:00 PM"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm font-semibold text-[#0F172A]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">Grace Period (minutes)</span>
            <input
              type="number"
              value={policy.grace_period_minutes || ""}
              onChange={(e) => handleChange("grace_period_minutes", parseInt(e.target.value) || 0)}
              min="0"
              max="59"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm font-semibold text-[#0F172A]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">Late Warning Threshold (minutes)</span>
            <input
              type="number"
              value={policy.late_warning_minutes || ""}
              onChange={(e) => handleChange("late_warning_minutes", parseInt(e.target.value) || 0)}
              min="0"
              max="59"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm font-semibold text-[#0F172A]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">Salary Deduction After (minutes)</span>
            <input
              type="number"
              value={policy.salary_deduction_after || ""}
              onChange={(e) => handleChange("salary_deduction_after", parseInt(e.target.value) || 0)}
              min="0"
              max="59"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm font-semibold text-[#0F172A]"
            />
          </div>

          <div className="md:col-span-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">Policy Description</span>
            <textarea
              value={policy.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all text-sm text-[#0F172A]"
            />
          </div>
        </div>
      </div>

      {/* Policy Timeline Visualization */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FaChartLine className="text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#0F172A]">Attendance Timeline Visualization</h2>
        </div>

        <div className="space-y-4">
          {/* Timeline Display */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#64748B] mb-3">Current Timeline:</div>
            
            <div className="space-y-2">
              {/* On Time Section */}
              <div className="flex items-center gap-3">
                <div className="w-16 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-center">
                  On Time 🟢
                </div>
                <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: "23%" }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[#64748B]">
                  {policy.shift_start || "10:00 AM"} - 
                  {(() => {
                    const start = timeToMinutes(policy.shift_start);
                    const end = start + (parseInt(policy.grace_period_minutes) || 14);
                    return minutesToTime(end);
                  })()}
                </div>
              </div>

              {/* Late Warning Section */}
              <div className="flex items-center gap-3">
                <div className="w-16 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded text-center">
                  Late Warning 🟠
                </div>
                <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: "23%" }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[#64748B]">
                  {(() => {
                    const start = timeToMinutes(policy.shift_start);
                    const end = start + (parseInt(policy.grace_period_minutes) || 14);
                    const end2 = start + (parseInt(policy.late_warning_minutes) || 29);
                    return `${minutesToTime(end)} - ${minutesToTime(end2)}`;
                  })()}
                </div>
              </div>

              {/* Salary Deduction Section */}
              <div className="flex items-center gap-3">
                <div className="w-16 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded text-center">
                  Salary Deduction 🔴
                </div>
                <div className="flex-1 h-2 bg-rose-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500" 
                    style={{ width: "54%" }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[#64748B]">
                  {(() => {
                    const start = timeToMinutes(policy.shift_start);
                    const end = start + (parseInt(policy.late_warning_minutes) || 29);
                    return `${minutesToTime(end)} & After`;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Status Legend */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <FaCheckCircle className="mx-auto mb-1 text-emerald-600 text-lg" />
              <p className="font-bold text-emerald-800">On Time</p>
              <p className="text-[10px] text-emerald-600">No deduction</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <FaClock className="mx-auto mb-1 text-amber-600 text-lg" />
              <p className="font-bold text-amber-800">Late Warning</p>
              <p className="text-[10px] text-amber-600">Warning issued</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <FaUserClock className="mx-auto mb-1 text-rose-600 text-lg" />
              <p className="font-bold text-rose-800">Salary Deduction</p>
              <p className="text-[10px] text-rose-600">1-day deduction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="text-blue-600 text-xl shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-bold text-blue-900 text-sm">How to use this policy settings:</h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc pl-5">
              <li>Change the shift start/end time to match your organization's working hours</li>
              <li>Adjust the grace period (default: 14 minutes) for on-time attendance</li>
              <li>Set the late warning threshold for warning employees</li>
              <li>Configure the salary deduction threshold for late arrivals</li>
              <li>Click "Save Policy" to apply changes immediately</li>
              <li>Click "Reset Default" to restore the original policy settings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Table Creation Instructions */}
      <div className={`bg-amber-50 rounded-2xl p-6 border border-amber-200 transition-all ${showCreateTableHelp ? 'max-h-96 opacity-100' : 'max-h-20 opacity-100'}`}>
        <button 
          type="button"
          onClick={() => setShowCreateTableHelp(!showCreateTableHelp)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-amber-600 text-lg" />
            <h3 className="font-bold text-amber-900 text-sm">Supabase Table Setup Required</h3>
          </div>
          <span className="text-xs text-amber-600 font-bold">
            {showCreateTableHelp ? "Hide Instructions" : "Show Instructions"}
          </span>
        </button>
        
        {showCreateTableHelp && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-amber-800">
              The <code>attendance_policy</code> table doesn't exist in your Supabase database yet. Please create it using the following steps:
            </p>
            
            <ol className="list-decimal pl-5 space-y-2 text-xs text-amber-800">
              <li>Go to your <strong>Supabase Dashboard</strong> (https://supabase.com/dashboard)</li>
              <li>Select your project: <code className="bg-amber-100 px-1 rounded">uzwmwtkldgchnuqxamov</code></li>
              <li>Click on <strong>SQL Editor</strong> in the left sidebar</li>
              <li>Click <strong>New Query</strong></li>
            </ol>
            
            <div className="bg-white border border-amber-300 rounded-lg p-3 text-xs font-mono overflow-x-auto">
              <pre className="text-amber-900">
{`-- Create attendance_policy table
CREATE TABLE IF NOT EXISTS attendance_policy (
  id TEXT PRIMARY KEY DEFAULT 'policy_1',
  shift_start TEXT DEFAULT '10:00 AM',
  shift_end TEXT DEFAULT '6:00 PM',
  grace_period_minutes INTEGER DEFAULT 14,
  late_warning_minutes INTEGER DEFAULT 29,
  salary_deduction_after INTEGER DEFAULT 30,
  policy_name TEXT DEFAULT 'Standard Policy',
  description TEXT DEFAULT 'Standard attendance policy for employees and students',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default record
INSERT INTO attendance_policy (id, shift_start, shift_end, grace_period_minutes, late_warning_minutes, salary_deduction_after, policy_name, description)
VALUES ('policy_1', '10:00 AM', '6:00 PM', 14, 29, 30, 'Standard Policy', 'Standard attendance policy for employees and students')
ON CONFLICT (id) DO NOTHING;`}
              </pre>
            </div>
            
            <ol className="list-decimal pl-5 space-y-2 text-xs text-amber-800">
              <li>Paste the SQL code above into the SQL Editor</li>
              <li>Click <strong>Run</strong> or press <code className="bg-amber-100 px-1 rounded">Ctrl+Enter</code></li>
              <li>Refresh this page and the policy settings will work!</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

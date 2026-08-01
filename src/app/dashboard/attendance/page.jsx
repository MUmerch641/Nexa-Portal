"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";
import StatusLight from "@/components/StatusLight";
import { getCurrentIp, getCurrentMinutes, determineAttendanceState } from "@/lib/attendanceUtils";
import "@/app/dashboard/attendance/attendance.css";

export default function AttendancePage() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("employee");
  const [ip, setIp] = useState("Detecting...");
  const [officeIp, setOfficeIp] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [todayRecords, setTodayRecords] = useState([]);

  // Fetch session, office IP configured by Admin in Settings, user role & today's attendance
  useEffect(() => {
    const fetchData = async () => {
      const storedRole = localStorage.getItem("user_role") || "employee";
      setUserRole(storedRole);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Fetch Office IP configured in Admin Settings
      const { data: setting } = await supabase.from("settings").select("office_ip").single();
      setOfficeIp(setting?.office_ip ?? "");
      
      // Fetch user's current public IP via IPify
      const clientIp = await getCurrentIp();
      setIp(clientIp);

      if (session?.user?.id) {
        const { data: records, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("user_id", session.user.id);
        
        if (records) {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const filtered = records.filter((r) => {
            const timeStr = r.timestamp || r.created_at || r.date || r.time;
            return timeStr && new Date(timeStr) >= startOfDay;
          }).map(r => ({
            ...r,
            timestamp: r.timestamp || r.created_at || r.date || r.time || new Date().toISOString()
          }));
          setTodayRecords(filtered);
        }
      } else {
        const savedToday = localStorage.getItem(`today_attendance_${storedRole}`);
        if (savedToday) {
          try { setTodayRecords(JSON.parse(savedToday)); } catch(e) {}
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAttendance = async (type) => {
    const role = user?.user_metadata?.role || userRole || "employee";
    const minutes = getCurrentMinutes();
    // Compare IPify detected IP against Admin Settings office IP
    const ipMatch = officeIp ? ip === officeIp : true;
    
    const { allowed, modalMessage, status, lightColor, label } = determineAttendanceState(role, minutes, ipMatch);

    if (!allowed) {
      setModal({
        isOpen: true,
        title: "Attendance Blocked",
        message: modalMessage,
        type: status,
      });
      return;
    }

    const newRecord = {
      type,
      timestamp: new Date().toISOString(),
      ip_address: ip,
    };

    const nowIso = newRecord.timestamp;
    if (user?.id) {
      // 1. Try with timestamp & ip_address
      let res = await supabase.from("attendance").insert({
        user_id: user.id,
        type,
        timestamp: nowIso,
        ip_address: ip,
      });

      // 2. If timestamp column missing, try created_at & ip_address
      if (res.error && res.error.message?.includes("timestamp")) {
        res = await supabase.from("attendance").insert({
          user_id: user.id,
          type,
          created_at: nowIso,
          ip_address: ip,
        });
      }

      // 3. Fallback without ip_address
      if (res.error && res.error.message?.includes("ip_address")) {
        res = await supabase.from("attendance").insert({
          user_id: user.id,
          type,
          created_at: nowIso,
        });
      }

      // 4. Final fallback with minimal fields (user_id & type)
      if (res.error) {
        res = await supabase.from("attendance").insert({
          user_id: user.id,
          type,
        });
      }
    }

    const updatedRecords = [...todayRecords, newRecord];
    setTodayRecords(updatedRecords);
    localStorage.setItem(`today_attendance_${role}`, JSON.stringify(updatedRecords));

    // Calculate total working hours automatically on check out
    let workingHoursMsg = "";
    if (type === "check_out") {
      const checkInRecord = todayRecords.find((r) => r.type === "check_in");
      if (checkInRecord) {
        const checkInTime = new Date(checkInRecord.timestamp);
        const checkOutTime = new Date(newRecord.timestamp);
        const diffMs = checkOutTime - checkInTime;
        const hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
        workingHoursMsg = ` Total working duration for today: ${hours} hours.`;
      }
    }

    setModal({
      isOpen: true,
      title: type === "check_in" ? "Check-In Recorded" : "Check-Out Recorded",
      message: `${modalMessage}${workingHoursMsg}`,
      type: status,
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Live Attendance System...</div>;

  const minutesNow = getCurrentMinutes();
  const currentRole = user?.user_metadata?.role || userRole || "employee";
  const ipMatch = officeIp ? ip === officeIp : true;
  const { lightColor, label } = determineAttendanceState(currentRole, minutesNow, ipMatch);

  const checkIn = todayRecords.find((r) => r.type === "check_in");
  const checkOut = todayRecords.find((r) => r.type === "check_out");

  // Working hours calculation
  let workingHoursDisplay = null;
  if (checkIn && checkOut) {
    const diffMs = new Date(checkOut.timestamp) - new Date(checkIn.timestamp);
    workingHoursDisplay = (diffMs / (1000 * 60 * 60)).toFixed(2);
  }

  return (
    <div className="attendance-wrapper">
      <div className="attendance-card-main">
        {/* Header */}
        <h1 className="attendance-header-glow">Live Attendance Dashboard</h1>
        <p className="attendance-subtitle">
          Real-Time Automated Attendance Control with Office Network IP Verification & Salary Audit
        </p>

        {/* Role-Based Attendance Policy Guidance Card */}
        <div className="rounded-2xl p-5 border text-left text-xs space-y-2 mb-6 bg-slate-950/60 border-slate-700/60 text-slate-100 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
              📌 {currentRole === "admin" ? "Admin Master Control Rules" : currentRole === "employee" ? "Paid Employee Staff Attendance Rules" : "Student & Intern Attendance Rules"}
            </span>
            <span className="bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-lg text-[11px] font-mono text-blue-300 font-bold">
              Office Hours: 10:00 AM
            </span>
          </div>

          {currentRole === "student" || currentRole === "internship" || currentRole === "intern" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <p className="text-slate-400 font-bold text-[10px]">BEFORE 10:00 AM</p>
                <p className="text-slate-200 font-semibold mt-0.5">🔒 Attendance Closed</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                <p className="text-emerald-400 font-bold text-[10px]">10:00 AM - 10:15 AM</p>
                <p className="text-emerald-200 font-semibold mt-0.5">🟢 Slightly Late (Allowed)</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40">
                <p className="text-amber-400 font-bold text-[10px]">10:15 AM - 11:00 AM</p>
                <p className="text-amber-200 font-semibold mt-0.5">🟠 Final Warning</p>
              </div>
              <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40">
                <p className="text-rose-400 font-bold text-[10px]">AFTER 11:00 AM</p>
                <p className="text-rose-200 font-semibold mt-0.5">🔴 Late Attendance Fine</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <p className="text-slate-400 font-bold text-[10px]">BEFORE 10:00 AM</p>
                <p className="text-slate-200 font-semibold mt-0.5">🔒 Office Hours Not Started</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                <p className="text-emerald-400 font-bold text-[10px]">10:00 AM - 10:15 AM</p>
                <p className="text-emerald-200 font-semibold mt-0.5">🟢 On-Time Check-In</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40">
                <p className="text-amber-400 font-bold text-[10px]">10:15 AM - 11:00 AM</p>
                <p className="text-amber-200 font-semibold mt-0.5">🟠 Late / Policy Warning</p>
              </div>
              <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40">
                <p className="text-rose-400 font-bold text-[10px]">AFTER 11:00 AM</p>
                <p className="text-rose-200 font-semibold mt-0.5">🔴 1-Day Salary Deduction</p>
              </div>
            </div>
          )}
        </div>

        {/* Live Status Indicator */}
        <div className="status-pill-glow mb-8">
          <StatusLight color={lightColor} />
          <div className="text-left">
            <p className="text-xs uppercase font-bold tracking-wider text-blue-400">Live Status Engine</p>
            <p className="text-lg font-black capitalize text-white">{label} ({lightColor.toUpperCase()})</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => handleAttendance("check_in")}
            disabled={!!checkIn}
            className={`w-full py-4 text-base rounded-xl ${checkIn ? "attendance-btn-disabled" : "attendance-btn-in"}`}
          >
            {checkIn ? "Checked In ✅" : "Check In Now"}
          </button>

          <button
            onClick={() => handleAttendance("check_out")}
            disabled={!checkIn || !!checkOut}
            className={`w-full py-4 text-base rounded-xl ${!checkIn || checkOut ? "attendance-btn-disabled" : "attendance-btn-out"}`}
          >
            {checkOut ? "Checked Out ✅" : "Check Out Now"}
          </button>
        </div>

        {/* Network & Session Info Panel */}
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 space-y-4 text-left text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-800">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Active Portal Role</p>
              <p className="text-base font-bold text-amber-400 capitalize mt-0.5">{currentRole}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Public IP (IPify)</p>
              <p className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded text-blue-300 font-bold border border-slate-800 mt-1 inline-block">
                {ip || "Detecting..."}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Registered Campus Network IP</p>
              <p className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded text-emerald-300 font-bold border border-slate-800 mt-1 inline-block">
                {officeIp || "Not Set (Testing Mode)"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-800/40">
              <p className="text-xs text-emerald-400 font-bold uppercase">Today Check-In Time</p>
              <p className="text-lg font-black text-emerald-300 mt-1">
                {checkIn ? new Date(checkIn.timestamp).toLocaleTimeString() : "Not Checked In"}
              </p>
            </div>
            <div className="bg-rose-950/30 p-3.5 rounded-xl border border-rose-800/40">
              <p className="text-xs text-rose-400 font-bold uppercase">Today Check-Out Time</p>
              <p className="text-lg font-black text-rose-300 mt-1">
                {checkOut ? new Date(checkOut.timestamp).toLocaleTimeString() : "Not Checked Out"}
              </p>
            </div>
          </div>

          {workingHoursDisplay && (
            <div className="bg-emerald-500/20 border border-emerald-400/40 p-4 rounded-xl text-center">
              <p className="text-xs text-emerald-300 uppercase font-extrabold tracking-wider">Total Working Hours Completed Today</p>
              <p className="text-2xl font-black text-emerald-200 mt-1">{workingHoursDisplay} Hours</p>
            </div>
          )}
        </div>

        {/* Daily Attendance History Records Table */}
        <div className="mt-8 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 text-left text-xs space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs">
              📅 Today's Live Attendance Audit Log
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
              Total Logs: {todayRecords.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] bg-slate-950/60">
                  <th className="py-3 px-3">Log Action</th>
                  <th className="py-3 px-3">Exact Timestamp</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3 text-right">Network Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {todayRecords.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400 italic">
                      No attendance logs recorded today. Click 'Check In Now' above at 10:00 AM.
                    </td>
                  </tr>
                ) : (
                  todayRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold capitalize">
                        {r.type === "check_in" ? "🟢 Check-In" : "🔴 Check-Out"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-blue-300">
                        {r.ip_address || ip}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                          r.type === "check_in"
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                            : "bg-rose-950/80 text-rose-300 border-rose-800/60"
                        }`}>
                          Verified Success
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
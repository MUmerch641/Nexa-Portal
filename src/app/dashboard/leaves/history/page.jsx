"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbFetch, dbSaveRecord } from "@/lib/dbPersistence";

export default function LeaveHistoryPage() {

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const getLeaveHistory = async () => {
    try {
      const data = await dbFetch("leaves");
      setLeaves(data || []);
    } catch (e) {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const targetLeave = leaves.find(l => l.id === id);
    const updatedLeave = targetLeave ? { ...targetLeave, status } : { id, status };
    try {
      await dbSaveRecord("leaves", updatedLeave);
    } catch(e) {}

    getLeaveHistory();
  };

  useEffect(() => {
    getLeaveHistory();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-black">
        Loading Leave Records...
      </div>
    );
  }

  return (
    <div>

      <h1 className="mb-6 text-3xl font-bold text-blue-600">
        Leave History
      </h1>

      <div className="overflow-x-auto rounded-xl bg-white shadow">

        <table className="w-full">

          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Start Date</th>
              <th className="p-3 text-left">End Date</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {
              leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-5 text-center text-gray-500">
                    No Leave Records Found
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="border-b">

                    <td className="p-3 text-black">
                      {leave.employees?.full_name}
                    </td>

                    <td className="p-3 text-black">
                      {leave.leave_type}
                    </td>

                    <td className="p-3 text-black">
                      {leave.start_date}
                    </td>

                    <td className="p-3 text-black">
                      {leave.end_date}
                    </td>

                    <td className="p-3 text-black">
                      {leave.reason}
                    </td>

                    <td className="p-3 text-black">
                      {leave.status}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => updateStatus(leave.id, "Approved")}
                        className="mr-2 rounded bg-green-600 px-3 py-2 text-white"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateStatus(leave.id, "Rejected")}
                        className="rounded bg-red-600 px-3 py-2 text-white"
                      >
                        Reject
                      </button>
                    </td>

                  </tr>
                ))
              )
            }
          </tbody>

        </table>

      </div>

    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AttendanceHistory() {

  const [attendance, setAttendance] = useState([]);

  const [editingId, setEditingId] = useState(null);
 const editAttendance = (item) => {
  setEditingId(item.id);
  setEmployeeId(item.employee_id);
  setStatus(item.status);
  setCheckIn(item.check_in);
  setCheckOut(item.check_out);
};
  const getAttendance = async () => {

    const { data, error } = await supabase
      .from("attendance")
      .select(`
        id,
        date,
        status,
        check_in,
        check_out,
        employees (
          full_name
        )
      `)
      .order("date", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setAttendance(data);
  };
  const deleteAttendance = async (id) => {
    const confirmDelete = window.confirm(
  "Are you sure you want to delete this attendance?"
);

if (!confirmDelete) return;

  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  getAttendance();

};

  useEffect(() => {
    getAttendance();
  }, []);

  return (
    <div>

      <h1 className="mb-6 text-3xl font-bold text-blue-600">
        Attendance History
      </h1>

      <div className="overflow-x-auto rounded-xl bg-white shadow">

        <table className="w-full">

          <thead className="bg-blue-600 text-white">

            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Check In</th>
              <th className="p-3">Check Out</th>
              <th className="p-3">Actions</th>
            </tr>

          </thead>

          <tbody>

            {attendance.map((item) => (

              <tr key={item.id} className="border-b text-stone-950">

                <td className="p-3">
                  {item.employees?.full_name}
                </td>

                <td className="p-3">
                  {item.date}
                </td>

                <td className="p-3">
                  {item.status}
                </td>

                <td className="p-3">
                  {item.check_in}
                </td>

                <td className="p-3">
                  {item.check_out}
                </td>
                <td className="p-3 flex gap-2">

 <button
 onClick={() => router.push(`/dashboard/attendance/edit/${item.id}`)}
  className="rounded bg-blue-600 px-3 py-1 text-white"
>
  Edit
</button>

  <button
  onClick={() => deleteAttendance(item.id)}
  className="rounded bg-red-600 px-3 py-1 text-white"
>
  Delete
</button>

</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
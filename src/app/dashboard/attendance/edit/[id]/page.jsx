"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

export default function EditAttendance() {
  const { id } = useParams();
  const router = useRouter();

  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    employee_id: "",
    date: "",
    status: "Present",
    check_in: "",
    check_out: "",
  });

  const getEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name");

    if (error) {
      console.log(error);
      return;
    }

    setEmployees(data);
  };

  const getAttendance = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    setForm(data);
  };

  useEffect(() => {
    if (id) {
      getEmployees();
      getAttendance();
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const updateAttendance = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from("attendance")
      .update(form)
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Attendance Updated Successfully");

    router.push("/dashboard/attendance/history");
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-blue-600">
        Edit Attendance
      </h1>

      <form
        onSubmit={updateAttendance}
        className="max-w-xl rounded-xl bg-white p-6 shadow-sm"
      >
        <label className="mb-2 block text-black">
          Select Employee
        </label>

        <select
          name="employee_id"
          value={form.employee_id}
          onChange={handleChange}
          className="mb-4 w-full rounded-lg border border-blue-200 p-3 text-black"
        >
          <option value="">Select Employee</option>

          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-black">
          Date
        </label>

        <input
          type="date"
          name="date"
          value={form.date || ""}
          onChange={handleChange}
          className="mb-4 w-full rounded-lg border border-blue-200 p-3 text-black"
        />

        <label className="mb-2 block text-black">
          Status
        </label>

        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="mb-4 w-full rounded-lg border border-blue-200 p-3 text-black"
        >
          <option>Present</option>
          <option>Absent</option>
          <option>Leave</option>
        </select>

        <label className="mb-2 block text-black">
          Check In
        </label>

        <input
          type="time"
          name="check_in"
          value={form.check_in || ""}
          onChange={handleChange}
          className="mb-4 w-full rounded-lg border border-blue-200 p-3 text-black"
        />

        <label className="mb-2 block text-black">
          Check Out
        </label>

        <input
          type="time"
          name="check_out"
          value={form.check_out || ""}
          onChange={handleChange}
          className="mb-6 w-full rounded-lg border border-blue-200 p-3 text-black"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
        >
          Update Attendance
        </button>
      </form>
    </div>
  );
}
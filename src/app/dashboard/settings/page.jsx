"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";

export default function SettingsPage() {
  const [role, setRole] = useState("employee");
  const [officeIp, setOfficeIp] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  // Load role from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem("user_role") || "employee";
    setRole(storedRole);
  }, []);


  // Load the stored office IP on mount
  useEffect(() => {
    const fetchIp = async () => {
      const { data, error } = await supabase.from("settings").select("office_ip").single();
      if (error) {
        setModal({ isOpen: true, title: "Error", message: error.message, type: "error" });
      } else {
        setOfficeIp(data?.office_ip ?? "");
      }
      setLoading(false);
    };
    fetchIp();
  }, []);

  // Fetch current device IP via ipify
  const handleUseCurrentIp = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const json = await res.json();
      setOfficeIp(json.ip || "");
    } catch (e) {
      setModal({ isOpen: true, title: "Error", message: "Failed to get current IP", type: "error" });
    }
  };

  const handleSave = async () => {
    const { error } = await supabase.from("settings").upsert({ office_ip: officeIp }, { onConflict: "office_ip" });
    if (error) {
      setModal({ isOpen: true, title: "Error", message: error.message, type: "error" });
    } else {
      setModal({ isOpen: true, title: "Success", message: "Office IP saved", type: "success" });
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Office IP Settings</h1>
      <input
        type="text"
        value={officeIp}
        onChange={e => setOfficeIp(e.target.value)}
        placeholder="Enter office IP"
        className="w-full border rounded px-3 py-2 mb-4"
      />
      <div className="flex gap-2 mb-4">
        <button onClick={handleUseCurrentIp} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Use Current IP
        </button>
        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Save
        </button>
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

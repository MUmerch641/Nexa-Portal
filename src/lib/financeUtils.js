// src/lib/financeUtils.js

import { supabase } from "@/lib/supabase";

/**
 * Fetch all finance records for the organization.
 */
export async function fetchFinanceRecords() {
  const { data, error } = await supabase.from("finance").select("*");
  if (error) throw error;
  return data;
}

/**
 * Add a new finance record.
 * @param {Object} record - { type, amount, description, date, paid }
 */
export async function addFinanceRecord(record) {
  const { error, data } = await supabase.from("finance").insert(record).single();
  if (error) throw error;
  return data;
}

/**
 * Toggle the paid flag of a finance record.
 * @param {string} id - record id
 * @param {boolean} paid - new paid status
 */
export async function togglePaid(id, paid) {
  const { error, data } = await supabase
    .from("finance")
    .update({ paid })
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Calculate totals per category and overall.
 * @param {Array} records - finance records array
 * @returns {Object} { totalsByType, overallTotal }
 */
export function calculateTotals(records) {
  const totalsByType = {};
  let overallTotal = 0;
  records.forEach((r) => {
    const amt = Number(r.amount) || 0;
    overallTotal += amt;
    totalsByType[r.type] = (totalsByType[r.type] || 0) + amt;
  });
  return { totalsByType, overallTotal };
}

// src/lib/financeUtils.js
import { supabase } from "@/lib/supabase";

// 15 Standard Expense Categories
export const EXPENSE_CATEGORIES = [
  "Employee Salary",
  "Office Rent",
  "Electricity Bill",
  "Water Bill",
  "Internet Bill",
  "Gas Bill",
  "Office Maintenance",
  "Office Equipment",
  "Computer & Laptop Purchase",
  "Software Licenses",
  "Marketing & Advertising",
  "Travel Expense",
  "Fuel Expense",
  "Office Supplies",
  "Miscellaneous Expense"
];

// Income Categories
export const INCOME_CATEGORIES = [
  "Client Project Payment",
  "Software Sales",
  "Maintenance Charges",
  "Consultation Fee",
  "Other Income"
];

// Initial Datasets (Empty defaults so Admin enters real records)
export const INITIAL_EXPENSES = [];
export const INITIAL_INCOMES = [];
export const INITIAL_UTILITY_BILLS = [];

import { dbFetch } from "@/lib/dbPersistence";

export async function fetchFinanceRecords() {
  try {
    const data = await dbFetch("expenses", INITIAL_EXPENSES);
    if (data && data.length > 0) return data;
  } catch (e) {}
  return INITIAL_EXPENSES;
}

/**
 * Export data array to CSV/Excel file download
 */
export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k];
            cell = cell.toString().replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator);
      })
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}


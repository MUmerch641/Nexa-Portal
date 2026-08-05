import { supabase } from "@/lib/supabase";

export const DEFAULT_COMPANY_INFO = {
  company_name: "Antigravity Software House (Pvt) Ltd",
  company_logo: "https://cdn-icons-png.flaticon.com/512/1006/1006771.png",
  currency_symbol: "Rs.",
  company_address: "Corporate Tech Campus, Innovation Parkway, Phase 6",
  contact_number: "+92 300 1234567",
  email_address: "info@softwarehouse.com",
  website_url: "https://softwarehouse.com",
  tax_registration_no: "TRN-99887766-PAK",
  updated_at: new Date().toISOString(),
  updated_by: "Muhammad Rahim Bugti (Super Admin)"
};

export function getCompanyInfo() {
  try {
    const saved = localStorage.getItem("software_house_company_info");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_COMPANY_INFO;
}

export async function updateCompanyInfo(updatedFields, adminEmail) {
  const current = getCompanyInfo();
  const newCompanyObj = {
    ...current,
    ...updatedFields,
    updated_at: new Date().toISOString(),
    updated_by: adminEmail || "Admin Officer"
  };

  // 1. Save to LocalStorage
  try {
    localStorage.setItem("software_house_company_info", JSON.stringify(newCompanyObj));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("companyInfoUpdated"));
    }
  } catch (e) {}

  // 2. Save to Supabase DB settings table
  try {
    await supabase.from("settings").upsert({
      id: "company-info-config",
      company_name: newCompanyObj.company_name,
      company_logo: newCompanyObj.company_logo,
      currency_symbol: newCompanyObj.currency_symbol,
      company_address: newCompanyObj.company_address,
      contact_number: newCompanyObj.contact_number,
      email_address: newCompanyObj.email_address,
      website_url: newCompanyObj.website_url,
      tax_registration_no: newCompanyObj.tax_registration_no,
      updated_at: newCompanyObj.updated_at,
      updated_by: newCompanyObj.updated_by
    });
  } catch (e) {}

  return newCompanyObj;
}

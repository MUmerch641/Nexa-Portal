import { dbSaveRecord } from "@/lib/dbPersistence";

export const DEFAULT_COMPANY_INFO = {
  company_name: "Nexa Innovation and Technology",
  company_logo: "/logo.jpeg",
  currency_symbol: "Rs.",
  company_address: "",
  contact_number: "",
  email_address: "",
  website_url: "",
  tax_registration_no: "",
  updated_at: new Date().toISOString(),
  updated_by: ""
};

export function getCompanyInfo() {
  try {
    const saved = localStorage.getItem("software_house_company_info");
    if (saved) {
      const companyInfo = JSON.parse(saved);
      if (companyInfo.company_logo === "/logo.svg" || companyInfo.company_logo === "/logo.png") {
        companyInfo.company_logo = "/logo.jpeg";
      }
      return companyInfo;
    }
  } catch (e) {}
  return DEFAULT_COMPANY_INFO;
}

export async function fetchCompanyInfo() {
  try {
    const records = await dbFetch("settings", []);
    const saved = records.find((record) => record.id === "company-info-config");
    if (saved) {
      try { localStorage.setItem("software_house_company_info", JSON.stringify(saved)); } catch (e) {}
      return { ...DEFAULT_COMPANY_INFO, ...saved };
    }
  } catch (e) {}
  return getCompanyInfo();
}

export async function updateCompanyInfo(updatedFields, adminEmail) {
  const current = await fetchCompanyInfo();
  const newCompanyObj = {
    ...current,
    ...updatedFields,
    updated_at: new Date().toISOString(),
    updated_by: adminEmail || "Admin Officer"
  };

  await dbSaveRecord("settings", {
    id: "company-info-config",
    ...newCompanyObj,
  });

  // Keep this browser's cache in step with the shared server record.
  try {
    localStorage.setItem("software_house_company_info", JSON.stringify(newCompanyObj));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("companyInfoUpdated"));
    }
  } catch (e) {}

  return newCompanyObj;
}

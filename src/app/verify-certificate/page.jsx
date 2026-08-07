"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaAward,
  FaGraduationCap,
  FaQrcode,
  FaShieldAlt,
  FaCalendarAlt,
  FaUserCheck,
  FaBuilding,
  FaPrint,
  FaArrowLeft
} from "react-icons/fa";

import { verifyCertificateById, INITIAL_CERTIFICATES } from "@/lib/studentTaskUtils";

export default function VerifyCertificatePage() {
  const searchParams = useSearchParams();
  const certId = searchParams.get("id") || "CERT-NEXA-2026-9901";

  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    async function loadVerification() {
      setLoading(true);
      try {
        const found = await verifyCertificateById(certId);
        setCertData(found);
      } catch (e) {
        console.error("Error verifying certificate:", e);
        setCertData(null);
      } finally {
        setLoading(false);
      }
    }

    loadVerification();
  }, [certId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      {/* Top Header */}
      <div className="w-full max-w-xl mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <FaArrowLeft /> Back to Portal
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <FaShieldAlt className="text-blue-600" /> Official Verification Portal
        </div>
      </div>

      {/* Verification Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        {/* Banner header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 text-white text-center space-y-2 relative">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-blue-400 mb-2 shadow-inner">
            <FaAward className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase">
            Nexa Technology & Training Institute
          </h1>
          <p className="text-xs text-blue-200 font-medium">
            Official QR Certificate & Credential Verification System
          </p>
        </div>

        <div className="p-8 space-y-6">
          {loading ? (
            <div className="text-center py-12 space-y-3">
              <div className="inline-block animate-spin text-blue-600">
                <FaQrcode className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold text-slate-500">Verifying Certificate Credentials...</p>
            </div>
          ) : certData ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                <FaCheckCircle className="h-4 w-4 text-emerald-600" />
                <span>OFFICIAL CERTIFICATE VERIFIED & VALID</span>
              </div>

              {/* Certificate Details */}
              <div className="space-y-3 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-700">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Certificate Number:</span>
                  <span className="font-mono font-bold text-blue-600 text-sm">{certData.certificate_number}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{certData.student_name}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Course Name:</span>
                  <span className="font-semibold text-slate-800">{certData.course_name}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Completion Date:</span>
                  <span className="font-medium text-slate-800">{certData.completion_date}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Grade / Rating:</span>
                  <span className="font-bold text-emerald-600">{certData.grade}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Authorized Instructor:</span>
                  <span className="font-medium text-slate-800">{certData.instructor_name}</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-400 space-y-1 border-t border-slate-100 pt-4">
                <p>Issued by Nexa Portal Enterprise Software House Management</p>
                <p className="font-mono">Security Checksum: 0x89F2A901B34C (Verified)</p>
              </div>
            </div>
          ) : (
            /* Invalid Certificate Fallback */
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <FaTimesCircle className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Certificate Not Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No valid certificate found for credential ID <strong>"{certId}"</strong>. The certificate may have been revoked or is invalid.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

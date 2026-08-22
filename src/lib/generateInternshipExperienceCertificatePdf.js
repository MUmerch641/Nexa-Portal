/**
 * Generates an official printable/downloadable 3-Month Internship Experience & Recommendation Certificate PDF.
 */
export function generatePrintableInternshipExperienceCertificatePdf(certData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const certId = certData.cert_id || `EXP-${Math.floor(100000 + Math.random() * 900000)}`;
  const internName = certData.intern_name || certData.student_name || "Intern Candidate";
  const domain = certData.tech_domain || certData.course_name || "Full Stack Software Engineering";
  const mode = certData.internship_mode || (certData.is_remote ? "Remote (Work From Home)" : "On-Site / Office");
  const startDate = certData.start_date || "2026-06-01";
  const endDate = certData.end_date || "2026-09-01";

  // Live Scannable QR Code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    `VERIFIED-EXPERIENCE-CERTIFICATE:${certId}|INTERN:${internName}|DOMAIN:${domain}|MODE:${mode}|DURATION:3_MONTHS|ISSUER:NEXA_PORTAL`
  )}`;

  // Live Scannable 1D Barcode
  const barCodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(certId)}&scale=3&rotate=N&includetext`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>3-Month Internship Experience Certificate - ${internName}</title>
        <style>
          body { font-family: 'Georgia', serif; padding: 25px; background: #0f172a; color: #0f172a; margin: 0; }
          .cert-border { border: 12px double #2563eb; padding: 40px; background: #fff; border-radius: 18px; text-align: center; position: relative; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
          .cert-header { font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #1e293b; text-transform: uppercase; margin-bottom: 6px; }
          .cert-sub { font-size: 13px; font-family: 'Helvetica Neue', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #2563eb; font-weight: bold; }
          .presented-to { font-size: 14px; font-style: italic; color: #64748b; margin-top: 22px; }
          .intern-name { font-size: 36px; font-weight: bold; color: #1e3a8a; text-decoration: underline; margin: 12px 0 8px 0; letter-spacing: 1px; }
          .cert-body { font-size: 14px; font-family: 'Helvetica Neue', sans-serif; color: #334155; max-width: 680px; margin: 0 auto 22px auto; line-height: 1.6; }
          .domain-title { font-weight: bold; color: #0f172a; font-size: 19px; text-transform: uppercase; margin: 6px 0; }
          
          .mode-badge { display: inline-block; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; font-size: 11px; font-weight: bold; padding: 3px 12px; border-radius: 20px; text-transform: uppercase; margin-top: 4px; }

          /* Codes Section */
          .codes-section { display: flex; justify-content: space-between; align-items: center; margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 20px; font-family: 'Helvetica Neue', sans-serif; text-align: left; }
          .qr-box { text-align: center; }
          .qr-box img { width: 95px; height: 95px; border: 2px solid #1e293b; border-radius: 6px; padding: 3px; background: #fff; }
          .barcode-box { text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px; }
          .barcode-box img { max-height: 48px; }
          .code-label { font-size: 8px; color: #64748b; font-weight: bold; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
          
          .sig-box { text-align: center; font-size: 12px; }
          .sig-line { border-top: 2px solid #1e293b; width: 180px; margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <div class="cert-sub">NEXA PORTAL • SOFTWARE HOUSE & TECH LABS</div>
          <div class="cert-header">Certificate of Experience</div>
          <div style="font-size:11px; font-family:'Helvetica Neue', sans-serif; color:#475569; font-weight:bold; letter-spacing:1px;">OFFICIAL 3-MONTH PROFESSIONAL INTERNSHIP CREDENTIAL</div>

          <div class="presented-to">This is officially certified that</div>
          <div class="intern-name">${internName}</div>

          <div class="cert-body">
            has successfully completed a <strong>3-Month Professional Internship Program</strong> working in the capacity of
            <div class="domain-title">${domain}</div>
            <div>
              <span class="mode-badge">Program Mode: ${mode}</span>
            </div>
            <p style="font-size:13px; color:#475569; margin-top:12px; line-height: 1.6;">
              During the internship tenure from <strong>${startDate}</strong> to <strong>${endDate}</strong>, the candidate demonstrated outstanding technical capability, disciplined work ethic, project execution, and adherence to production software engineering standards.
            </p>
          </div>

          <div class="codes-section">
            {/* 1. Scannable QR Code */}
            <div class="qr-box">
              <img src="${qrCodeUrl}" alt="Verification QR Code" />
              <div class="code-label">SCANNABLE QR VERIFICATION</div>
              <div style="font-size:9px; font-family:monospace; font-weight:bold; color:#1e3a8a; margin-top:2px;">${certId}</div>
            </div>

            {/* 2. 1D Barcode */}
            <div class="barcode-box">
              <img src="${barCodeUrl}" alt="Official 1D Barcode" />
              <div class="code-label">OFFICIAL 1D BARCODE SERIAL</div>
            </div>

            {/* 3. Official Signature Seal */}
            <div class="sig-box">
              <div class="sig-line"></div>
              <strong>Director of Engineering</strong>
              <div style="color:#64748b; font-size:11px;">Technical HR & Development Head</div>
              <div style="color:#94a3b8; font-size:10px; margin-top:2px;">Issued: ${todayStr}</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

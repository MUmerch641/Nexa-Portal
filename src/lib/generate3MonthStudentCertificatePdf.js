export function generatePrintable3MonthStudentCertificatePdf(certData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const certId = certData.cert_id || `CERT-${Math.floor(100000 + Math.random() * 900000)}`;
  
  // Live Scannable QR Code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    `VERIFIED-CERTIFICATE:${certId}|STUDENT:${certData.student_name}|COURSE:${certData.course_name}|COMPLETED:3_MONTHS`
  )}`;

  // Live Scannable 1D Barcode
  const barCodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(certId)}&scale=3&rotate=N&includetext`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>3-Month Course Completion Certificate - ${certData.student_name}</title>
        <style>
          body { font-family: 'Georgia', serif; padding: 25px; background: #0f172a; color: #0f172a; margin: 0; }
          .cert-border { border: 12px double #d97706; padding: 35px; background: #fff; border-radius: 16px; text-align: center; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .cert-header { font-size: 26px; font-weight: bold; letter-spacing: 3px; color: #1e293b; text-transform: uppercase; margin-bottom: 5px; }
          .cert-sub { font-size: 13px; font-family: 'Helvetica Neue', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #d97706; font-weight: bold; }
          .presented-to { font-size: 14px; font-style: italic; color: #64748b; margin-top: 20px; }
          .student-name { font-size: 34px; font-weight: bold; color: #1e3a8a; text-decoration: underline; margin: 12px 0 8px 0; letter-spacing: 1px; }
          .cert-body { font-size: 14px; font-family: 'Helvetica Neue', sans-serif; color: #334155; max-width: 650px; margin: 0 auto 20px auto; line-height: 1.5; }
          .course-title { font-weight: bold; color: #0f172a; font-size: 18px; text-transform: uppercase; }
          
          /* Dual Barcode & QR Code Section */
          .codes-section { display: flex; justify-content: space-between; align-items: center; margin-top: 25px; border-top: 2px solid #e2e8f0; padding-top: 18px; font-family: 'Helvetica Neue', sans-serif; text-align: left; }
          .qr-box { text-align: center; }
          .qr-box img { width: 95px; height: 95px; border: 2px solid #1e293b; border-radius: 6px; padding: 3px; background: #fff; }
          .barcode-box { text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px; }
          .barcode-box img { max-height: 48px; }
          .code-label { font-size: 8px; color: #64748b; font-weight: bold; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
          
          .sig-box { text-align: center; font-size: 12px; }
          .sig-line { border-top: 2px solid #1e293b; width: 170px; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <div class="cert-sub">ANTIGRAVITY ACADEMY & SOFTWARE HOUSE</div>
          <div class="cert-header">Certificate of Completion</div>
          <div style="font-size:11px; font-family:'Helvetica Neue', sans-serif; color:#475569; font-weight:bold;">OFFICIAL 3-MONTH DIPLOMA CERTIFICATION</div>

          <div class="presented-to">This is proudly awarded to</div>
          <div class="student-name">${certData.student_name}</div>

          <div class="cert-body">
            for successfully completing the <strong>3-Month Intensive Practical Training</strong> in
            <div class="course-title" style="margin-top:6px;">${certData.course_name}</div>
            <p style="font-size:12px; color:#64748b; margin-top:8px;">
              Batch: ${certData.batch || "Batch #14"} • Duration: 3 Months (12 Weeks) • Status: 100% Practical Progress Cleared
            </p>
          </div>

          <div class="codes-section">
            {/* 1. QR Code */}
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
              <strong>Engr. Hamza</strong>
              <div style="color:#64748b; font-size:11px;">Lead Instructor & Managing Director</div>
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

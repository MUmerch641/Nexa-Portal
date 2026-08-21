export function generatePrintableStudentFeeReceiptPdf(receiptData = {}) {
  const studentName = receiptData.student_name || receiptData.studentName || receiptData.name || "Student";
  const studentEmail = receiptData.student_email || receiptData.email || "student@gmail.com";
  const courseName = receiptData.course_name || receiptData.course || "Full Stack MERN Web Development";
  const batch = receiptData.batch || "Batch #14 (Morning)";
  const receiptNo = receiptData.receipt_no || receiptData.receiptNo || `REC-${Date.now().toString().slice(-6)}`;
  const paymentDate = receiptData.payment_date || receiptData.paymentDate || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const paymentMethod = receiptData.payment_method || receiptData.paymentMethod || "Bank Transfer / Online Slip";
  const txnRef = receiptData.txn_ref || receiptData.txnRef || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const amountPaid = Number(receiptData.amount_paid || receiptData.amount || receiptData.paidAmount || 25000);
  const remainingBalance = Number(receiptData.remaining_balance || receiptData.remainingBalance || 0);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Pop-up blocked! Please allow pop-ups for this portal to print fee receipts.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Official Course Fee Receipt - ${studentName} (${receiptNo})</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; background: #f8fafc; }
          
          .receipt-card { 
            background: #ffffff; 
            border: 2px solid #2563eb; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto; 
            border-radius: 16px; 
            box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.1);
          }

          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            border-bottom: 2px solid #e2e8f0; 
            padding-bottom: 24px; 
            margin-bottom: 28px; 
          }

          .company-title { 
            font-size: 22px; 
            font-weight: 900; 
            color: #1d4ed8; 
            letter-spacing: -0.5px; 
            line-height: 1.2;
          }

          .company-sub { 
            font-size: 12px; 
            color: #64748b; 
            margin-top: 4px; 
            font-weight: 500;
          }

          .receipt-badge { 
            background: #eff6ff; 
            border: 1px solid #bfdbfe; 
            color: #1e40af; 
            padding: 8px 16px; 
            border-radius: 10px; 
            font-weight: 800; 
            font-size: 12px; 
            letter-spacing: 0.5px;
            text-align: right;
          }

          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 16px; 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 12px; 
            border: 1px solid #e2e8f0;
            font-size: 13px; 
            margin-bottom: 28px; 
          }

          .info-item label { 
            font-size: 10px; 
            text-transform: uppercase; 
            color: #64748b; 
            font-weight: 700; 
            display: block;
            margin-bottom: 2px;
          }

          .info-item value { 
            font-weight: 700; 
            color: #0f172a; 
            font-size: 13px;
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 13px; 
            margin-bottom: 28px; 
          }

          th { 
            text-align: left; 
            background: #f1f5f9; 
            padding: 12px 14px; 
            color: #475569; 
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
          }

          td { 
            padding: 14px; 
            border-bottom: 1px solid #f1f5f9; 
            color: #1e293b;
          }

          .total-box { 
            background: #0f172a; 
            color: #ffffff; 
            padding: 24px; 
            border-radius: 12px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 35px;
          }

          .amount { 
            font-size: 26px; 
            font-weight: 900; 
            color: #4ade80; 
            font-family: monospace;
          }

          .signatures { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end;
            margin-top: 40px; 
            padding-top: 24px; 
            border-top: 1px dashed #cbd5e1;
            font-size: 12px; 
            text-align: center; 
          }

          .sig-line { 
            border-top: 1.5px solid #0f172a; 
            width: 160px; 
            margin-bottom: 6px; 
          }

          @media print {
            body { background: #fff; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .receipt-card { border: 2px solid #2563eb; max-width: 100%; border-radius: 0; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-card">
          <div class="header">
            <div>
              <div class="company-title">ANTIGRAVITY ACADEMY & SOFTWARE HOUSE</div>
              <div class="company-sub">Official Student Fee Payment Receipt & Proof of Clearance</div>
            </div>
            <div class="receipt-badge">
              <div>RECEIPT NO</div>
              <div style="font-size: 14px; margin-top:2px;">${receiptNo}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label>Student Name</label>
              <value>${studentName}</value>
            </div>
            <div class="info-item">
              <label>Student Email</label>
              <value>${studentEmail}</value>
            </div>
            <div class="info-item">
              <label>Enrolled Course / Tech Domain</label>
              <value>${courseName}</value>
            </div>
            <div class="info-item">
              <label>Batch / Session</label>
              <value>${batch}</value>
            </div>
            <div class="info-item">
              <label>Payment Date</label>
              <value>${paymentDate}</value>
            </div>
            <div class="info-item">
              <label>Verification Status</label>
              <value style="color:#059669;">VERIFIED & APPROVED BY ADMIN 🟢</value>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Payment Method</th>
                <th>Transaction Ref / Proof</th>
                <th style="text-align:right;">Amount Cleared</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>30-Day Recurring Course Fee</strong></td>
                <td>${paymentMethod}</td>
                <td><code style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-weight:bold; font-size:11px;">${txnRef}</code></td>
                <td style="text-align:right; font-weight:bold; font-size:14px; color:#1d4ed8;">Rs. ${amountPaid.toLocaleString("en-PK")}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <div>
              <div style="font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:bold; letter-spacing:0.5px;">Total Cleared Amount</div>
              <div style="font-size:11px; color:#cbd5e1; margin-top:3px;">
                Official Fee Status: <strong>PAID (Cycle Reset +30 Days)</strong>
                ${remainingBalance > 0 ? ` • Remaining Balance: Rs. ${remainingBalance.toLocaleString("en-PK")}` : ""}
              </div>
            </div>
            <div class="amount">Rs. ${amountPaid.toLocaleString("en-PK")}</div>
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line"></div>
              <div style="font-weight:bold; color:#0f172a;">Accounts Officer</div>
              <div style="font-size:10px; color:#64748b;">Antigravity Finance</div>
            </div>
            <div>
              <div style="color:#1d4ed8; font-weight:900; font-size:14px; letter-spacing:1px;">OFFICIALLY VERIFIED</div>
              <div style="font-size:10px; color:#64748b; margin-top:2px;">Finance & Accounts Seal 🔒</div>
            </div>
            <div>
              <div class="sig-line"></div>
              <div style="font-weight:bold; color:#0f172a;">Student Signature</div>
              <div style="font-size:10px; color:#64748b;">Acknowledged</div>
            </div>
          </div>
        </div>
        <script>
          setTimeout(function() {
            window.print();
          }, 300);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

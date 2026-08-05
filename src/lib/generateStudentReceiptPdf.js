export function generatePrintableStudentFeeReceiptPdf(receiptData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Official Course Fee Receipt - ${receiptData.student_name} (${receiptData.receipt_no})</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #0f172a; background: #fff; }
          .receipt-card { border: 2px solid #1d4ed8; padding: 35px; max-width: 750px; margin: 0 auto; border-radius: 12px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
          .company-title { font-size: 22px; font-weight: bold; color: #1d4ed8; letter-spacing: 1px; }
          .receipt-badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 6px 14px; border-radius: 8px; font-weight: bold; font-size: 12px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 18px; border-radius: 8px; font-size: 13px; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px; }
          th { text-align: left; background: #f1f5f9; padding: 10px; color: #475569; }
          td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
          .total-box { background: #1e293b; color: #fff; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
          .amount { font-size: 24px; font-weight: 900; color: #4ade80; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="receipt-card">
          <div class="header">
            <div>
              <div class="company-title">ANTIGRAVITY ACADEMY & SOFTWARE HOUSE</div>
              <div style="font-size:12px; color:#64748b; margin-top:4px;">Official Student Fee Payment Receipt</div>
            </div>
            <div class="receipt-badge">RECEIPT NO: ${receiptData.receipt_no || "REC-88912"}</div>
          </div>

          <div class="info-grid">
            <div><strong>Student Name:</strong> ${receiptData.student_name}</div>
            <div><strong>Student Email:</strong> ${receiptData.student_email}</div>
            <div><strong>Enrolled Course:</strong> ${receiptData.course_name}</div>
            <div><strong>Batch / Session:</strong> ${receiptData.batch || "Batch #14 (Morning)"}</div>
            <div><strong>Payment Date:</strong> ${receiptData.payment_date || todayStr}</div>
            <div><strong>Verification Status:</strong> <span style="color:#059669; font-weight:bold;">VERIFIED & APPROVED BY ADMIN</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Payment Method</th>
                <th>Transaction Ref / Proof</th>
                <th style="text-align:right;">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monthly Tuition & Course Fee</td>
                <td>Bank Transfer / Online Slip</td>
                <td><code>${receiptData.txn_ref || "TXN-99882211"}</code></td>
                <td style="text-align:right; font-weight:bold;">Rs. ${Number(receiptData.amount || 25000).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <div>
              <div style="font-size:11px; text-transform:uppercase; color:#94a3b8; font-weight:bold;">Total Cleared Amount</div>
              <div style="font-size:11px; color:#cbd5e1;">Official Fee Status: PAID (Cycle Reset +30 Days)</div>
            </div>
            <div class="amount">Rs. ${Number(receiptData.amount || 25000).toLocaleString()}</div>
          </div>

          <div class="signatures">
            <div>
              <div>________________________</div>
              <div style="margin-top:4px; font-weight:bold;">Accounts Officer Signature</div>
            </div>
            <div>
              <div style="color:#2563eb; font-weight:bold;">OFFICIALLY VERIFIED</div>
              <div style="font-size:11px; color:#64748b;">Antigravity Finance Seal</div>
            </div>
            <div>
              <div>________________________</div>
              <div style="margin-top:4px; font-weight:bold;">Student Signature</div>
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

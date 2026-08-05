export function generatePrintablePayslipPdf(payroll, employee) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const totalDeductions = 
    Number(payroll.leave_deduction || 0) +
    Number(payroll.late_penalty || 0) +
    Number(payroll.advance_deduction || 0) +
    Number(payroll.loan_deduction || 0);

  const totalEarnings = 
    Number(payroll.basic_salary || 0) +
    Number(payroll.overtime_amount || 0) +
    Number(payroll.bonus_amount || 0) +
    Number(payroll.incentive_amount || 0);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Official Salary Payslip - ${employee.full_name} (${payroll.month})</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #0f172a; background: #fff; }
          .payslip-card { border: 2px solid #1e293b; padding: 35px; max-width: 800px; margin: 0 auto; border-radius: 12px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
          .company-title { font-size: 24px; font-weight: bold; color: #1d4ed8; letter-spacing: 1px; }
          .payslip-badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 6px 14px; border-radius: 8px; font-weight: bold; font-size: 12px; }
          .emp-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 18px; border-radius: 8px; font-size: 13px; margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #475569; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
          .breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; background: #f1f5f9; padding: 8px; color: #475569; }
          td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
          .net-salary { background: #1e293b; color: #fff; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
          .net-amount { font-size: 24px; font-weight: 900; color: #4ade80; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="payslip-card">
          <div class="header">
            <div>
              <div class="company-title">ANTIGRAVITY SOFTWARE HOUSE (PVT) LTD</div>
              <div style="font-size:12px; color:#64748b; margin-top:4px;">Corporate Payroll & Accounts Management</div>
            </div>
            <div class="payslip-badge">SALARY PAYSLIP: ${payroll.month}</div>
          </div>

          <div class="emp-details">
            <div><strong>Employee Name:</strong> ${employee.full_name}</div>
            <div><strong>Employee Email:</strong> ${employee.email}</div>
            <div><strong>Department:</strong> ${employee.department || 'Software Development'}</div>
            <div><strong>Designation:</strong> ${employee.designation || 'Senior Lead Developer'}</div>
          </div>

          <div class="breakdown-grid">
            <div>
              <div class="section-title">🟢 Earnings & Allowances</div>
              <table>
                <tr><td>Basic Salary</td><td style="text-align:right;">Rs. ${Number(payroll.basic_salary).toLocaleString()}</td></tr>
                <tr><td>Overtime Pay (${payroll.overtime_hours || 0} hrs)</td><td style="text-align:right;">Rs. ${Number(payroll.overtime_amount || 0).toLocaleString()}</td></tr>
                <tr><td>Performance Bonus</td><td style="text-align:right;">Rs. ${Number(payroll.bonus_amount || 0).toLocaleString()}</td></tr>
                <tr><td>Project Incentive</td><td style="text-align:right;">Rs. ${Number(payroll.incentive_amount || 0).toLocaleString()}</td></tr>
                <tr style="font-weight:bold; background:#f8fafc;"><td>Gross Earnings</td><td style="text-align:right;">Rs. ${totalEarnings.toLocaleString()}</td></tr>
              </table>
            </div>

            <div>
              <div class="section-title">🔴 Deductions & Adjustments</div>
              <table>
                <tr><td>Unapproved Leave Cut</td><td style="text-align:right; color:#dc2626;">- Rs. ${Number(payroll.leave_deduction || 0).toLocaleString()}</td></tr>
                <tr><td>Late Attendance Penalty</td><td style="text-align:right; color:#dc2626;">- Rs. ${Number(payroll.late_penalty || 0).toLocaleString()}</td></tr>
                <tr><td>Advance Salary Recovery</td><td style="text-align:right; color:#dc2626;">- Rs. ${Number(payroll.advance_deduction || 0).toLocaleString()}</td></tr>
                <tr><td>Loan Installment Cut</td><td style="text-align:right; color:#dc2626;">- Rs. ${Number(payroll.loan_deduction || 0).toLocaleString()}</td></tr>
                <tr style="font-weight:bold; background:#f8fafc;"><td>Total Deductions</td><td style="text-align:right; color:#dc2626;">- Rs. ${totalDeductions.toLocaleString()}</td></tr>
              </table>
            </div>
          </div>

          <div class="net-salary">
            <div>
              <div style="font-size:12px; text-transform:uppercase; color:#94a3b8; font-weight:bold;">Final Net Payable Salary</div>
              <div style="font-size:11px; color:#cbd5e1;">Direct Bank Transfer / Cleared Payout</div>
            </div>
            <div class="net-amount">Rs. ${Number(payroll.final_payable_salary).toLocaleString()}</div>
          </div>

          <div class="signatures">
            <div>
              <div>________________________</div>
              <div style="margin-top:4px; font-weight:bold;">Accounts & Finance Manager</div>
            </div>
            <div>
              <div style="color:#2563eb; font-weight:bold;">VERIFIED & DISBURSED</div>
              <div style="font-size:11px; color:#64748b;">Antigravity Accounts Seal</div>
            </div>
            <div>
              <div>________________________</div>
              <div style="margin-top:4px; font-weight:bold;">Employee Signature</div>
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

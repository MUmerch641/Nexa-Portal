import { NextResponse } from "next/server";
import tls from "tls";
import net from "net";
import fs from "fs";
import path from "path";

function sendViaPort587({ user, pass, to, subject, html, text }) {
  return new Promise((resolve) => {
    if (!user || !pass || !to) {
      return resolve({ success: false, reason: `Missing credentials` });
    }

    try {
      const socket = net.createConnection(587, "smtp.gmail.com");
      socket.setTimeout(7000);

      let step = 0;
      let secureSocket = null;

      const send = (sock, cmd) => {
        try { sock.write(cmd + "\r\n"); } catch (e) {}
      };

      const handleData = (msg, currentSocket) => {
        if (step === 0 && msg.startsWith("220")) {
          step = 1;
          send(currentSocket, "EHLO nexa-portal.com");
        } else if (step === 1 && msg.startsWith("250")) {
          step = 2;
          send(currentSocket, "STARTTLS");
        } else if (step === 2 && msg.startsWith("220")) {
          step = 3;
          try {
            secureSocket = tls.connect({
              socket: currentSocket,
              rejectUnauthorized: false
            }, () => {
              send(secureSocket, "EHLO nexa-portal.com");
            });

            secureSocket.on("data", (d) => handleData(d.toString(), secureSocket));
            secureSocket.on("error", (e) => resolve({ success: false, reason: `TLS Error: ${e.message}` }));
          } catch(e) {
            resolve({ success: false, reason: e.message });
          }
        } else if (step === 3 && msg.startsWith("250")) {
          step = 4;
          const authString = Buffer.from(`\0${user}\0${pass}`).toString("base64");
          send(currentSocket, `AUTH PLAIN ${authString}`);
        } else if (step === 4 && msg.startsWith("235")) {
          step = 5;
          send(currentSocket, `MAIL FROM:<${user}>`);
        } else if (step === 5 && msg.startsWith("250")) {
          step = 6;
          send(currentSocket, `RCPT TO:<${to}>`);
        } else if (step === 6 && msg.startsWith("250")) {
          step = 7;
          send(currentSocket, "DATA");
        } else if (step === 7 && msg.startsWith("354")) {
          step = 8;
          const emailBody = [
            `From: <${user}>`,
            `To: <${to}>`,
            `Subject: ${subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            ``,
            html || text,
            `.`
          ].join("\r\n");
          send(currentSocket, emailBody);
        } else if (step === 8 && msg.startsWith("250")) {
          step = 9;
          send(currentSocket, "QUIT");
          resolve({ success: true, reason: "Delivered via Port 587 STARTTLS" });
        } else if (msg.startsWith("535") || msg.startsWith("503")) {
          resolve({ success: false, reason: `Gmail Auth Error: ${msg.trim()}` });
        }
      };

      socket.on("data", (data) => {
        if (step < 3) handleData(data.toString(), socket);
      });

      socket.on("error", (err) => resolve({ success: false, reason: `Port 587 Socket Error: ${err.message}` }));
      socket.on("timeout", () => {
        socket.destroy();
        resolve({ success: false, reason: "Port 587 Socket Timeout" });
      });
    } catch (e) {
      resolve({ success: false, reason: e.message });
    }
  });
}

function sendViaPort465({ user, pass, to, subject, html, text }) {
  return new Promise((resolve) => {
    if (!user || !pass || !to) {
      return resolve({ success: false, reason: `Missing credentials` });
    }

    try {
      const client = tls.connect(465, "smtp.gmail.com", { rejectUnauthorized: false, timeout: 5000 }, () => {
        let step = 0;

        const send = (cmd) => {
          try { client.write(cmd + "\r\n"); } catch (e) {}
        };

        client.on("data", (data) => {
          const msg = data.toString();

          if (step === 0 && msg.startsWith("220")) {
            step = 1;
            send("EHLO nexa-portal.com");
          } else if (step === 1 && msg.startsWith("250")) {
            step = 2;
            const authString = Buffer.from(`\0${user}\0${pass}`).toString("base64");
            send(`AUTH PLAIN ${authString}`);
          } else if (step === 2 && msg.startsWith("235")) {
            step = 3;
            send(`MAIL FROM:<${user}>`);
          } else if (step === 3 && msg.startsWith("250")) {
            step = 4;
            send(`RCPT TO:<${to}>`);
          } else if (step === 4 && msg.startsWith("250")) {
            step = 5;
            send("DATA");
          } else if (step === 5 && msg.startsWith("354")) {
            step = 6;
            const emailBody = [
              `From: <${user}>`,
              `To: <${to}>`,
              `Subject: ${subject}`,
              `MIME-Version: 1.0`,
              `Content-Type: text/html; charset=UTF-8`,
              ``,
              html || text,
              `.`
            ].join("\r\n");
            send(emailBody);
          } else if (step === 6 && msg.startsWith("250")) {
            step = 7;
            send("QUIT");
            resolve({ success: true, reason: "Delivered via Port 465 SSL" });
          } else if (msg.startsWith("535") || msg.startsWith("503") || msg.startsWith("554")) {
            resolve({ success: false, reason: `Gmail Auth Error: ${msg.trim()}` });
          }
        });

        client.on("error", (err) => resolve({ success: false, reason: err.message }));
        client.on("timeout", () => {
          client.destroy();
          resolve({ success: false, reason: "Port 465 Timeout" });
        });
      });
    } catch(err) {
      resolve({ success: false, reason: err.message });
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject, content, studentName } = body;

    if (!to) {
      return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
    }

    const cleanEmail = to.trim().toLowerCase();
    const emailSubject = subject || `💳 Monthly Fee Reminder Alert - Nexa Enterprise`;
    const emailBodyText = content || `Dear ${studentName || "Student"},\n\nThis is an official fee reminder that your monthly course tuition fee is due.\n\nPlease clear your balance or submit your fee slip to maintain active student privileges.\n\nNexa Enterprise Accounts & Finance Dept`;

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 20px; border-radius: 12px; text-align: center; color: white; font-weight: bold; font-size: 18px; letter-spacing: 0.5px;">
          💳 Nexa Enterprise Portal - Monthly Fee Alert
        </div>
        <div style="padding: 24px 0; color: #0f172a; line-height: 1.7; font-size: 14px;">
          <p style="font-size: 16px; font-weight: bold; color: #1e293b;">Dear ${studentName || "Student"},</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border-left: 4px solid #2563eb; font-size: 13px; color: #334155; margin: 16px 0; white-space: pre-line;">
            ${emailBodyText}
          </div>
          <p style="font-size: 12px; color: #64748b;">Please log into your Nexa Student Portal dashboard to view cycle details or upload your fee payment slip.</p>
        </div>
        <div style="background-color: #eff6ff; padding: 14px; border-radius: 10px; font-size: 11px; color: #1e40af; text-align: center; border: 1px solid #bfdbfe;">
          Official System Notification • Dispatched to ${cleanEmail}
        </div>
      </div>
    `;

    // Dynamically load credentials from .env
    let smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
    let smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();
    let resendApiKey = (process.env.RESEND_API_KEY || "").trim();

    try {
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const lines = envContent.split(/\r?\n/);
        for (const line of lines) {
          let cleanLine = line.trim();
          if (cleanLine.includes("#")) cleanLine = cleanLine.split("#")[0].trim();
          if (cleanLine.startsWith("SMTP_USER=") || cleanLine.startsWith("EMAIL_USER=")) {
            const val = cleanLine.substring(cleanLine.indexOf("=") + 1).replace(/["']/g, "").trim();
            if (val && !val.includes("apka-email")) smtpUser = val;
          }
          if (cleanLine.startsWith("SMTP_PASS=") || cleanLine.startsWith("EMAIL_PASS=")) {
            const val = cleanLine.substring(cleanLine.indexOf("=") + 1).replace(/["']/g, "").replace(/\s+/g, "").trim();
            if (val && !val.includes("abcdefgh")) smtpPass = val;
          }
          if (cleanLine.startsWith("RESEND_API_KEY=")) {
            const val = cleanLine.substring(cleanLine.indexOf("=") + 1).replace(/["']/g, "").trim();
            if (val) resendApiKey = val;
          }
        }
      }
    } catch(e) {}

    let smtpResult = { success: false, reason: "Init" };

    // Try Resend API if API Key is configured
    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Nexa Finance <onboarding@resend.dev>",
            to: [cleanEmail],
            subject: emailSubject,
            html: htmlTemplate
          })
        });
        const resendData = await resendRes.json();
        if (resendRes.ok && resendData.id) {
          smtpResult = { success: true, reason: `Delivered via Resend API (ID: ${resendData.id})` };
        }
      } catch(e) {}
    }

    if (!smtpResult.success) {
      smtpResult = await sendViaPort465({
        user: smtpUser,
        pass: smtpPass,
        to: cleanEmail,
        subject: emailSubject,
        html: htmlTemplate,
        text: emailBodyText
      });
    }

    if (!smtpResult.success) {
      smtpResult = await sendViaPort587({
        user: smtpUser,
        pass: smtpPass,
        to: cleanEmail,
        subject: emailSubject,
        html: htmlTemplate,
        text: emailBodyText
      });
    }

    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(cleanEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;

    return NextResponse.json({
      success: true,
      message: smtpResult.success
        ? `Fee reminder email delivered directly to ${cleanEmail} Gmail Inbox! 📧`
        : `Fee reminder notice logged. Web Gmail backup ready.`,
      smtpResult,
      gmailWebUrl,
      smtpUser: smtpUser ? `${smtpUser.substring(0, 3)}***` : "none",
      emailDetails: {
        to: cleanEmail,
        studentName: studentName || "Student",
        subject: emailSubject,
        dispatchedAt: new Date().toISOString(),
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to dispatch email." }, { status: 500 });
  }
}

// Universal Serverless Function: send-email.js
// Works seamlessly across Vercel, Netlify, AWS Lambda, Firebase Functions, and local Node.js
import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';

const FIXED_BOT_USER = 'testvelocityonebot@gmail.com';
const FIXED_BOT_PASS = 'zwlmaxlavenhjvdt';

function loadEnvCredentials() {
  const envFiles = ['.env', '.env.local'];
  const credentials = {
    user: process.env.GMAIL_USER || process.env.SMTP_USER || FIXED_BOT_USER,
    pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    from: process.env.EMAIL_FROM || process.env.GMAIL_USER || FIXED_BOT_USER,
  };

  for (const envFile of envFiles) {
    const fullPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(fullPath)) {
      try {
        const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const match = trimmed.match(/^([\w_]+)\s*=\s*(.*)$/);
          if (match) {
            const key = match[1];
            let val = match[2].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (key === 'GMAIL_USER' || key === 'SMTP_USER') credentials.user = val;
            if (key === 'GMAIL_APP_PASSWORD' || key === 'SMTP_PASS') credentials.pass = val;
            if (key === 'SMTP_HOST') credentials.host = val;
            if (key === 'SMTP_PORT') credentials.port = Number(val) || 465;
            if (key === 'EMAIL_FROM') credentials.from = val;
          }
        }
      } catch {
        // Ignore environment file read errors
      }
    }
  }

  return credentials;
}

function sendSmtpEmail({ host, port, user, pass, to, from, subject, body, attachment }) {
  return new Promise((resolve, reject) => {
    if (!user || !pass) {
      return reject(new Error('Missing SMTP_USER / GMAIL_USER or SMTP_PASS / GMAIL_APP_PASSWORD'));
    }

    const recipients = (Array.isArray(to) ? to : String(to).split(/[,;]/))
      .map((r) => r.trim())
      .filter((r) => r.includes('@'));

    if (recipients.length === 0) {
      return reject(new Error('At least one valid recipient email is required'));
    }

    const socket = tls.connect(port || 465, host || 'smtp.gmail.com', { rejectUnauthorized: false }, () => {
      let state = 'CONNECTED';
      let buffer = '';
      let rcptIndex = 0;

      socket.setTimeout(25_000, () => {
        socket.destroy(new Error('SMTP connection timed out after 25 seconds'));
      });

      const dateStr = new Date().toUTCString();
      const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@gmail.com>`;
      const safeFrom = from || user;
      const fromHeader = `"VelocityONE Studio" <${safeFrom}>`;
      const toHeader = recipients.join(', ');
      const hasAttachment = Boolean(attachment && attachment.content);
      const attFilename = hasAttachment
        ? (attachment.filename || 'specification.md').endsWith('.md')
          ? attachment.filename
          : `${attachment.filename}.md`
        : null;
      const attBase64 = hasAttachment ? Buffer.from(attachment.content, 'utf8').toString('base64') : null;

      // Extract status if present in subject or body
      let statusTag = 'IN REVIEW';
      let statusBadgeColor = '#854d0e';
      let statusBgColor = '#fef9c3';
      let statusBorderColor = '#fef08a';
      if (/Approved/i.test(subject) || /Approved/i.test(body)) {
        statusTag = 'APPROVED';
        statusBadgeColor = '#166534';
        statusBgColor = '#dcfce7';
        statusBorderColor = '#bbf7d0';
      } else if (/Rejected/i.test(subject) || /Rejected/i.test(body)) {
        statusTag = 'REJECTED';
        statusBadgeColor = '#991b1b';
        statusBgColor = '#fee2e2';
        statusBorderColor = '#fecaca';
      }

      const escapedBody = (body || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '<br/>');

      const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:24px; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.06);">
    <tr>
      <td style="background:#0f172a; padding:18px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="color:#ffffff; font-size:16px; font-weight:700; letter-spacing:-0.3px;">⚡ VelocityONE Studio</span>
            </td>
            <td align="right">
              <span style="font-size:12px; font-weight:700; padding:4px 10px; border-radius:9999px; background:${statusBgColor}; color:${statusBadgeColor}; border:1px solid ${statusBorderColor};">
                ${statusTag}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px;">
        <h3 style="margin:0 0 16px 0; font-size:18px; color:#0f172a; line-height:1.4;">${subject}</h3>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:0 0 20px 0; font-size:13.5px; color:#334155; line-height:1.6;">
          ${escapedBody}
        </div>
        <div style="font-size:13px; color:#64748b;">
          <strong>Notification Sent:</strong> ${dateStr}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b; text-align:center;">
        Delivered automatically by VelocityONE Studio Status Notification System
      </td>
    </tr>
  </table>
</body>
</html>`;

      const altBoundary = '----=_Part_Alt_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const mixedBoundary = '----=_Part_Mixed_' + Date.now() + '_' + Math.random().toString(36).slice(2);

      let mimeMessage = '';
      if (hasAttachment) {
        mimeMessage = [
          `From: ${fromHeader}`,
          `Reply-To: <${safeFrom}>`,
          `To: ${toHeader}`,
          `Subject: ${subject}`,
          `Date: ${dateStr}`,
          `Message-ID: ${messageId}`,
          `X-Mailer: VelocityONE-Studio/6.11`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
          ``,
          `--${mixedBoundary}`,
          `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
          ``,
          `--${altBoundary}`,
          `Content-Type: text/plain; charset=utf-8`,
          `Content-Transfer-Encoding: 8bit`,
          ``,
          body,
          ``,
          `--${altBoundary}`,
          `Content-Type: text/html; charset=utf-8`,
          `Content-Transfer-Encoding: 8bit`,
          ``,
          htmlBody,
          ``,
          `--${altBoundary}--`,
          ``,
          `--${mixedBoundary}`,
          `Content-Type: text/markdown; charset=utf-8; name="${attFilename}"`,
          `Content-Disposition: attachment; filename="${attFilename}"`,
          `Content-Transfer-Encoding: base64`,
          ``,
          attBase64,
          ``,
          `--${mixedBoundary}--`,
          ``,
          `.`,
        ].join('\r\n');
      } else {
        mimeMessage = [
          `From: ${fromHeader}`,
          `Reply-To: <${safeFrom}>`,
          `To: ${toHeader}`,
          `Subject: ${subject}`,
          `Date: ${dateStr}`,
          `Message-ID: ${messageId}`,
          `X-Mailer: VelocityONE-Studio/6.11`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
          ``,
          `--${altBoundary}`,
          `Content-Type: text/plain; charset=utf-8`,
          `Content-Transfer-Encoding: 8bit`,
          ``,
          body,
          ``,
          `--${altBoundary}`,
          `Content-Type: text/html; charset=utf-8`,
          `Content-Transfer-Encoding: 8bit`,
          ``,
          htmlBody,
          ``,
          `--${altBoundary}--`,
          ``,
          `.`,
        ].join('\r\n');
      }

      socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\r\n');
        buffer = lines.pop();

        for (const line of lines) {
          const code = Number.parseInt(line.slice(0, 3), 10);
          if (Number.isNaN(code)) continue;

          if (state === 'CONNECTED' && code === 220) {
            state = 'EHLO';
            socket.write('EHLO localhost\r\n');
          } else if (state === 'EHLO' && code === 250 && line[3] === ' ') {
            state = 'AUTH';
            socket.write('AUTH LOGIN\r\n');
          } else if (state === 'AUTH' && code === 334) {
            state = 'USER';
            socket.write(Buffer.from(user).toString('base64') + '\r\n');
          } else if (state === 'USER' && code === 334) {
            state = 'PASS';
            socket.write(Buffer.from(pass).toString('base64') + '\r\n');
          } else if (state === 'PASS' && code === 235) {
            state = 'MAIL_FROM';
            socket.write(`MAIL FROM:<${safeFrom}>\r\n`);
          } else if ((state === 'MAIL_FROM' || state === 'RCPT_TO') && code === 250) {
            if (rcptIndex < recipients.length) {
              state = 'RCPT_TO';
              const nextRcpt = recipients[rcptIndex++];
              socket.write(`RCPT TO:<${nextRcpt}>\r\n`);
            } else {
              state = 'DATA';
              socket.write('DATA\r\n');
            }
          } else if (state === 'DATA' && code === 354) {
            state = 'SENDING_CONTENT';
            socket.write(mimeMessage + '\r\n');
          } else if (state === 'SENDING_CONTENT' && code === 250) {
            state = 'QUIT';
            socket.write('QUIT\r\n');
            socket.end();
            resolve({
              success: true,
              message: hasAttachment
                ? `Status notification sent via SMTP to ${recipients.length} recipient(s) (${recipients.join(', ')}) with attachment ${attFilename}`
                : `Status notification sent via SMTP to ${recipients.length} recipient(s) (${recipients.join(', ')})`,
              recipientsCount: recipients.length,
            });
          } else if (code === 221) {
            socket.end();
          } else if (code >= 400) {
            socket.destroy(new Error(`SMTP error (${code}): ${line}`));
          }
        }
      });

      socket.on('error', (err) => {
        reject(new Error(`TLS Socket error: ${err.message}`));
      });
    });
  });
}

async function universalHandler(arg1, arg2) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  const isStream = Boolean(arg2 && typeof arg2.writeHead === 'function');

  function reply(statusCode, payload) {
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (isStream) {
      if (!arg2.headersSent) {
        arg2.writeHead(statusCode, corsHeaders);
      }
      arg2.end(bodyStr);
      return;
    }
    return { statusCode, headers: corsHeaders, body: bodyStr };
  }

  const httpMethod = (isStream ? arg1.method : arg1 && arg1.httpMethod) || 'GET';
  if (httpMethod === 'OPTIONS') {
    return reply(200, '');
  }

  if (httpMethod === 'GET') {
    const creds = loadEnvCredentials();
    return reply(200, {
      configured: Boolean(creds.user && creds.pass),
      user: creds.user || '',
    });
  }

  if (httpMethod !== 'POST') {
    return reply(405, { success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let payload = null;
    if (isStream) {
      const req = arg1;
      if (req.body) {
        payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } else {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const raw = Buffer.concat(chunks).toString('utf8');
        payload = raw ? JSON.parse(raw) : null;
      }
    } else {
      const rawBody = arg1.isBase64Encoded ? Buffer.from(arg1.body, 'base64').toString('utf8') : arg1.body;
      payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    }

    if (payload && (payload.action === 'clear' || payload.action === 'clearConfig' || payload.action === 'resetConfig')) {
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_APP_PASSWORD;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let existing = fs.readFileSync(envPath, 'utf8');
          existing = existing.replace(/^GMAIL_USER=.*$/m, '');
          existing = existing.replace(/^GMAIL_APP_PASSWORD=.*$/m, '');
          existing = existing.replace(/^SMTP_USER=.*$/m, '');
          existing = existing.replace(/^SMTP_PASS=.*$/m, '');
          fs.writeFileSync(envPath, existing.trim() + '\n', 'utf8');
        }
      } catch (e) {
        console.warn('[API-WARN] Could not clear .env:', e.message);
      }
      return reply(200, { success: true, message: 'SMTP configuration cleared from server.' });
    }

    if (payload && (payload.action === 'register' || payload.action === 'saveConfig')) {
      const regUser = (payload.senderUser || FIXED_BOT_USER).trim();
      const regPass = (payload.senderPass || '').trim().replaceAll(/\s+/g, '');
      if (!regUser || !regPass || regPass.length < 8) {
        return reply(400, {
          success: false,
          error: 'A valid Gmail address and 16-character App Password are required to register.',
        });
      }

      if (payload.saveToEnv) {
        try {
          const envPath = path.join(process.cwd(), '.env');
          let existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
          if (!existing.includes('GMAIL_USER=')) {
            existing += `\nGMAIL_USER=${regUser}\n`;
          } else {
            existing = existing.replace(/^GMAIL_USER=.*$/m, `GMAIL_USER=${regUser}`);
          }
          if (!existing.includes('GMAIL_APP_PASSWORD=')) {
            existing += `GMAIL_APP_PASSWORD=${regPass}\n`;
          } else {
            existing = existing.replace(/^GMAIL_APP_PASSWORD=.*$/m, `GMAIL_APP_PASSWORD=${regPass}`);
          }
          fs.writeFileSync(envPath, existing, 'utf8');
        } catch (e) {
          console.warn('[API-WARN] Could not persist credentials to .env:', e.message);
        }
      }

      return reply(200, {
        success: true,
        message: 'SMTP credentials successfully registered.',
        user: regUser,
      });
    }

    const { to, subject, body, filename, content, senderUser, senderPass, saveToEnv } = payload || {};
    const recipients = (Array.isArray(to) ? to : String(to || '').split(/[,;]/)).map((r) => r.trim()).filter((r) => r.includes('@'));

    if (recipients.length === 0) {
      return reply(400, { success: false, error: 'At least one valid recipient email is required.' });
    }

    const creds = loadEnvCredentials();
    const user = (senderUser && senderUser.trim()) || creds.user || FIXED_BOT_USER;
    const cleanPass =
      (senderPass && senderPass.trim().replaceAll(/\s+/g, '')) ||
      (creds.pass && creds.pass.trim().replaceAll(/\s+/g, '')) ||
      (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').trim().replaceAll(/\s+/g, '') ||
      FIXED_BOT_PASS;
    const host = creds.host || 'smtp.gmail.com';
    const port = creds.port || 465;
    const from = creds.from || user || FIXED_BOT_USER;

    if (!user || !cleanPass) {
      return reply(200, {
        success: false,
        needsConfig: true,
        message: 'Gmail App Password not configured. Please enter your Gmail credentials to send status notifications directly.',
      });
    }

    const result = await sendSmtpEmail({
      host,
      port,
      user,
      pass: cleanPass,
      from,
      to,
      subject: subject || 'Markdown Specification Status Notification',
      body: body || '',
      attachment:
        filename && content
          ? {
              filename,
              content,
            }
          : null,
    });

    const response = reply(200, result);

    // Defer any environment persistence to background AFTER the HTTP response has completely finished and flushed.
    // This prevents Vite / local dev servers from restarting while an in-flight request is being processed.
    if (saveToEnv && senderUser && senderPass) {
      setTimeout(() => {
        try {
          const envPath = path.join(process.cwd(), '.env');
          let existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
          const curUserMatch = existing.match(/^GMAIL_USER\s*=\s*(.*)$/m);
          const curPassMatch = existing.match(/^GMAIL_APP_PASSWORD\s*=\s*(.*)$/m);
          const curUser = curUserMatch ? curUserMatch[1].trim().replaceAll(/^['"]|['"]$/g, '') : '';
          const curPass = curPassMatch ? curPassMatch[1].trim().replaceAll(/^['"]|['"]$/g, '') : '';

          if (curUser === senderUser.trim() && curPass === cleanPass) {
            return; // Already persisted and matches exactly
          }

          if (!existing.includes('GMAIL_USER=')) {
            existing += `\nGMAIL_USER=${senderUser.trim()}\n`;
          } else {
            existing = existing.replace(/^GMAIL_USER=.*$/m, `GMAIL_USER=${senderUser.trim()}`);
          }
          if (!existing.includes('GMAIL_APP_PASSWORD=')) {
            existing += `GMAIL_APP_PASSWORD=${cleanPass}\n`;
          } else {
            existing = existing.replace(/^GMAIL_APP_PASSWORD=.*$/m, `GMAIL_APP_PASSWORD=${cleanPass}`);
          }
          fs.writeFileSync(envPath, existing, 'utf8');
        } catch (e) {
          console.warn('[API-WARN] Could not persist credentials to .env:', e.message);
        }
      }, 2000);
    }

    return response;
  } catch (err) {
    return reply(500, { success: false, error: err.message });
  }
}

export default universalHandler;
export { universalHandler as handler };

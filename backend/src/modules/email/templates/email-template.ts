import { EmailLink } from '../email.types';

export interface TemplateInput {
  eyebrow: string;
  title: string;
  intro: string;
  details?: string[];
  cta?: EmailLink;
  footerNote?: string;
}

export interface RenderedEmail {
  text: string;
  html: string;
}

export function renderCasaXEmail(input: TemplateInput): RenderedEmail {
  const textParts = [
    input.title,
    '',
    input.intro,
    ...(input.details?.length ? ['', ...input.details] : []),
    ...(input.cta ? ['', `${input.cta.label}: ${input.cta.url}`] : []),
    '',
    input.footerNote ??
      'CasaX helps property teams keep occupancy, agreements, and payments accountable.',
  ];

  return {
    text: textParts.join('\n'),
    html: `
<!doctype html>
<html>
  <head>
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;padding:0;font-family:Inter,Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden">
            <tr>
              <td style="padding:32px 32px 8px">
                <div style="display:inline-block;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:8px 12px">${escapeHtml(input.eyebrow)}</div>
                <h1 style="font-size:28px;line-height:1.2;margin:24px 0 12px;color:#0f172a">${escapeHtml(input.title)}</h1>
                <p style="font-size:15px;line-height:1.75;color:#475569;margin:0">${escapeHtml(input.intro)}</p>
              </td>
            </tr>
            ${
              input.details?.length
                ? `<tr><td style="padding:20px 32px 0"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px">${input.details
                    .map(
                      (detail) =>
                        `<tr><td style="font-size:14px;line-height:1.7;color:#334155;padding:4px 0">${escapeHtml(detail)}</td></tr>`,
                    )
                    .join('')}</table></td></tr>`
                : ''
            }
            ${
              input.cta
                ? `<tr><td style="padding:28px 32px 4px"><a href="${escapeHtml(input.cta.url)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:14px;padding:14px 20px">${escapeHtml(input.cta.label)}</a></td></tr>`
                : ''
            }
            <tr>
              <td style="padding:28px 32px 32px">
                <p style="border-top:1px solid #e2e8f0;padding-top:20px;color:#64748b;font-size:12px;line-height:1.7;margin:0">${escapeHtml(
                  input.footerNote ??
                    'CasaX helps property teams keep occupancy, agreements, and payments accountable.',
                )}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });
}

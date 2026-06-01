import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

interface InvoiceItem {
  name: string
  qty: number
  price: number
}

function buildHtml(data: {
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  senderName: string
  senderAddr: string
  senderEmail: string
  items: InvoiceItem[]
  total: number
  bankInfo: string
  note: string
}) {
  const subtotal = data.items.reduce((sum, it) => sum + it.qty * it.price, 0)
  const tax = Math.round(subtotal * 0.1)

  const rows = data.items.map(it => `
    <tr>
      <td style="padding:10px 14px;border:1px solid #dde;font-size:14px">${it.name}</td>
      <td style="padding:10px 14px;border:1px solid #dde;font-size:14px;text-align:center">${it.qty}</td>
      <td style="padding:10px 14px;border:1px solid #dde;font-size:14px;text-align:right">¥${it.price.toLocaleString()}</td>
      <td style="padding:10px 14px;border:1px solid #dde;font-size:14px;text-align:right">¥${(it.qty * it.price).toLocaleString()}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Hiragino Sans','Meiryo',Arial,sans-serif;color:#111;background:#f5f7fa;margin:0;padding:40px 20px">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden">
    <div style="background:linear-gradient(135deg,#0077ff,#00aaff);padding:32px 40px">
      <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:.05em">請 求 書</h1>
      <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px">Invoice</p>
    </div>
    <div style="padding:32px 40px">
      <table style="width:100%;margin-bottom:24px">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:12px;color:#888">請求書番号</p>
            <p style="margin:0;font-weight:700;font-size:15px">${data.invoiceNo}</p>
          </td>
          <td style="text-align:right">
            <p style="margin:0 0 4px;font-size:12px;color:#888">請求日</p>
            <p style="margin:0;font-size:14px">${data.invoiceDate}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#888">お支払期限：<strong style="color:#e05">${data.dueDate}</strong></p>
          </td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px">
      <table style="width:100%;margin-bottom:24px">
        <tr>
          <td style="width:50%;vertical-align:top">
            <p style="margin:0 0 6px;font-size:12px;color:#888;font-weight:700;letter-spacing:.05em">請求先</p>
            <p style="margin:0;font-size:18px;font-weight:800">エンタイトルツーベース株式会社　御中</p>
          </td>
          <td style="width:50%;vertical-align:top;text-align:right">
            <p style="margin:0 0 6px;font-size:12px;color:#888;font-weight:700;letter-spacing:.05em">請求元</p>
            <p style="margin:0;font-size:16px;font-weight:700">${data.senderName}</p>
            ${data.senderAddr ? `<p style="margin:4px 0 0;font-size:12px;color:#555;white-space:pre-line">${data.senderAddr}</p>` : ''}
            <p style="margin:4px 0 0;font-size:12px;color:#555">${data.senderEmail}</p>
          </td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
        <thead>
          <tr style="background:#f0f4ff">
            <th style="padding:10px 14px;border:1px solid #dde;font-size:12px;text-align:left;font-weight:700">品目</th>
            <th style="padding:10px 14px;border:1px solid #dde;font-size:12px;text-align:center;font-weight:700">数量</th>
            <th style="padding:10px 14px;border:1px solid #dde;font-size:12px;text-align:right;font-weight:700">単価</th>
            <th style="padding:10px 14px;border:1px solid #dde;font-size:12px;text-align:right;font-weight:700">小計</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="text-align:right;margin:16px 0 24px">
        <table style="margin-left:auto;border-collapse:collapse">
          <tr>
            <td style="padding:4px 16px 4px 0;font-size:13px;color:#555;text-align:right">小計（税抜）</td>
            <td style="padding:4px 0;font-size:13px;color:#333;text-align:right;min-width:120px">¥${subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:4px 16px 4px 0;font-size:13px;color:#555;text-align:right">消費税（10%）</td>
            <td style="padding:4px 0;font-size:13px;color:#333;text-align:right">¥${tax.toLocaleString()}</td>
          </tr>
          <tr style="border-top:2px solid #ddd">
            <td style="padding:8px 16px 4px 0;font-size:15px;font-weight:700;color:#333;text-align:right">合計（税込）</td>
            <td style="padding:8px 0 4px;font-size:24px;font-weight:800;color:#0077ff;text-align:right">¥${data.total.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      ${data.bankInfo ? `
      <div style="background:#f8faff;border-radius:10px;padding:16px 20px;margin-bottom:16px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#888;letter-spacing:.05em">振込先</p>
        <p style="margin:0;font-size:13px;color:#333;white-space:pre-line">${data.bankInfo}</p>
      </div>` : ''}
      ${data.note ? `
      <div style="background:#fffbf0;border-radius:10px;padding:16px 20px;border-left:3px solid #f5c842">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#888;letter-spacing:.05em">備考</p>
        <p style="margin:0;font-size:13px;color:#333;white-space:pre-line">${data.note}</p>
      </div>` : ''}
    </div>
    <div style="background:#f8faff;padding:16px 40px;font-size:12px;color:#999;text-align:center">
      このメールはアフターサポートシステムより自動送信されています。
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const data = await req.json()
    const { invoiceNo, invoiceDate, dueDate, senderName, senderAddr, senderEmail, items, total, bankInfo, note } = data

    const html = buildHtml({ invoiceNo, invoiceDate, dueDate, senderName, senderAddr, senderEmail, items, total, bankInfo, note })

    await resend.emails.send({
      from: 'AFTER SUPPORT <onboarding@resend.dev>',
      to: ['keiri.entitle2base@gmail.com'],
      subject: `【請求書】${senderName} 様より - ${invoiceNo}`,
      html,
      replyTo: senderEmail || undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('Invoice email error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ ok: false, error: 'Missing URL' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tmovie.in/',
        'Origin': 'https://www.tmovie.in'
      }
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    const lowerText = text.toLowerCase();

    const forbiddenKeywords = [
      "rate limited",
      "too many requests",
      "temporary block",
      "temporarily rate limited",
      "quota exceeded",
      "error 429",
      "not found",
      "no video available",
      "cloudflare",
      "captcha"
    ];

    const hasErrorText = forbiddenKeywords.some(keyword => lowerText.includes(keyword));
    
    // If it's a 429 or has error text or is suspicious ly short
    if (!response.ok || response.status === 429 || hasErrorText || lowerText.length < 500) {
      return NextResponse.json({ 
        ok: false, 
        status: response.status,
        reason: hasErrorText ? 'Error text detected' : 'Low content or bad status'
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 200 });
  }
}

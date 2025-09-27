import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {};
  
  // Collect all headers
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Focus on Whop-related headers
  const whopHeaders = Object.keys(headers).filter(key => 
    key.toLowerCase().includes('whop') || 
    key.toLowerCase().includes('authorization') ||
    key.toLowerCase().includes('user')
  );

  const whopHeaderData: Record<string, string> = {};
  whopHeaders.forEach(key => {
    whopHeaderData[key] = headers[key];
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    allHeaders: headers,
    whopHeaders: whopHeaderData,
    url: request.url,
    method: request.method,
    userAgent: headers['user-agent'],
    referer: headers['referer'],
    origin: headers['origin']
  });
}

export async function POST(request: NextRequest) {
  const headers: Record<string, string> = {};
  
  // Collect all headers
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Focus on Whop-related headers
  const whopHeaders = Object.keys(headers).filter(key => 
    key.toLowerCase().includes('whop') || 
    key.toLowerCase().includes('authorization') ||
    key.toLowerCase().includes('user')
  );

  const whopHeaderData: Record<string, string> = {};
  whopHeaders.forEach(key => {
    whopHeaderData[key] = headers[key];
  });

  let body = null;
  try {
    body = await request.json();
  } catch (e) {
    body = 'Could not parse body';
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    allHeaders: headers,
    whopHeaders: whopHeaderData,
    body: body,
    url: request.url,
    method: request.method,
    userAgent: headers['user-agent'],
    referer: headers['referer'],
    origin: headers['origin']
  });
}

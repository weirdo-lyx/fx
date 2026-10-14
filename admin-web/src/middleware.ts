import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'muyamagicsecret'
);
const C_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_C || 'muyamagicsecret-c'
);

// CORS 来源（C 端 H5 部署源），生产环境通过 CORS_ORIGIN 配置
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8090';

// CORS 响应头（仅对 /api/c/* 生效，供 C 端跨域调用）
const corsHeaders = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, cookie, authorization',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 仅保护 /api/admin/** 和 /api/c/**(除 login)
  const isAdminApi = pathname.startsWith('/api/admin') && !pathname.endsWith('/login');
  const isCApi = pathname.startsWith('/api/c') && !pathname.endsWith('/login');
  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

  // CORS 预检：C 端跨域 OPTIONS 直接返回 204
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/c')) {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  // 给最终响应附加 CORS 头（仅 /api/c/*）
  const withCors = (res: NextResponse) => {
    if (pathname.startsWith('/api/c')) {
      Object.entries(corsHeaders).forEach(([key, value]) => res.headers.set(key, value));
    }
    return res;
  };

  // 如果是页面访问且未登录，重定向到登录页
  if (isAdminPage) {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    try {
      await jwtVerify(token, ADMIN_SECRET);
      return withCors(NextResponse.next());
    } catch {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (!isAdminApi && !isCApi) return withCors(NextResponse.next());

  const secret = isAdminApi ? ADMIN_SECRET : C_SECRET;
  const cookieName = isAdminApi ? 'admin_token' : 'c_token';
  // token 来源：优先 Authorization: Bearer <token>（H5 浏览器禁止脚本设置 Cookie 头，统一走授权头）；
  // 兼容 Cookie 方式（小程序端/后台页面）
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies.get(cookieName)?.value;

  if (!token) {
    return withCors(NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-role', payload.role as string);
    return withCors(NextResponse.next({ request: { headers: requestHeaders } }));
  } catch {
    return withCors(NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 }));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/c/:path*'],
};

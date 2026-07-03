export interface SecurityHeadersResult {
  hsts: boolean;
  x_frame_options: boolean;
  x_content_type_options: boolean;
  csp: boolean;
  referrer_policy: boolean;
  permissions_policy: boolean;
  score: number; // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  missing: string[];
  present: string[];
}

export function checkSecurityHeaders(headers: Record<string, string | string[]>): SecurityHeadersResult {
  const h: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    h[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
  }

  const hsts = !!h['strict-transport-security'];
  const x_frame_options =
    !!h['x-frame-options'] ||
    /frame-ancestors/i.test(h['content-security-policy'] || '');
  const x_content_type_options =
    (h['x-content-type-options'] || '').toLowerCase().includes('nosniff');
  const csp = !!h['content-security-policy'];
  const referrer_policy = !!h['referrer-policy'];
  const permissions_policy = !!(h['permissions-policy'] || h['feature-policy']);

  const checks = [hsts, x_frame_options, x_content_type_options, csp, referrer_policy, permissions_policy];
  const passed = checks.filter(Boolean).length;
  const score = Math.round((passed / checks.length) * 100);

  const missing: string[] = [];
  const present: string[] = [];
  if (hsts) present.push('HSTS'); else missing.push('HSTS');
  if (x_frame_options) present.push('X-Frame-Options'); else missing.push('X-Frame-Options');
  if (x_content_type_options) present.push('X-Content-Type-Options'); else missing.push('X-Content-Type-Options');
  if (csp) present.push('CSP'); else missing.push('Content-Security-Policy');
  if (referrer_policy) present.push('Referrer-Policy'); else missing.push('Referrer-Policy');
  if (permissions_policy) present.push('Permissions-Policy'); else missing.push('Permissions-Policy');

  const grade: SecurityHeadersResult['grade'] =
    score >= 84 ? 'A' : score >= 67 ? 'B' : score >= 50 ? 'C' : score >= 33 ? 'D' : 'F';

  return { hsts, x_frame_options, x_content_type_options, csp, referrer_policy, permissions_policy, score, grade, missing, present };
}

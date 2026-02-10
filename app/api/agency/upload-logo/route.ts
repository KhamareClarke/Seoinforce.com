import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const BUCKET = 'agency-logos';
const MAX_SIZE_MB = 2;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.account_type !== 'brand') {
      return NextResponse.json({ error: 'Agency access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, GIF, WebP or SVG.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File too large. Max ${MAX_SIZE_MB}MB.` }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
    const path = `${user.id}/${Date.now()}-${safeName}`;

    const buffer = await file.arrayBuffer();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        return NextResponse.json(
          { error: 'Storage not configured. Create a public bucket named "agency-logos" in Supabase Dashboard → Storage.' },
          { status: 503 }
        );
      }
      console.error('Logo upload error:', error);
      return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

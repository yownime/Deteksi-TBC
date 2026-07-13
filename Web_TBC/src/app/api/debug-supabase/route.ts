import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Check env vars
  checks["NEXT_PUBLIC_SUPABASE_URL"] = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `✅ Ada (${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}...)`
    : "❌ KOSONG!";

  checks["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? `✅ Ada (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20)}...)`
    : "❌ KOSONG!";

  checks["SUPABASE_SERVICE_ROLE_KEY"] = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? `✅ Ada (${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 20)}...)`
    : "❌ KOSONG!";

  // 2. Test actual Supabase connection
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("predictions")
      .select("id")
      .limit(1);

    if (error) {
      checks["DB_CONNECTION"] = `❌ Error: ${error.message} (code: ${error.code})`;
    } else {
      checks["DB_CONNECTION"] = `✅ Berhasil! Tabel predictions ditemukan. (${data?.length ?? 0} row dicek)`;
    }
  } catch (err: any) {
    checks["DB_CONNECTION"] = `❌ Exception: ${err.message}`;
  }

  // 3. Test storage bucket
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.storage.getBucket("xray-images");
    if (error) {
      checks["STORAGE_BUCKET"] = `❌ Bucket 'xray-images' Error: ${error.message}`;
    } else {
      checks["STORAGE_BUCKET"] = `✅ Bucket 'xray-images' ditemukan! Public: ${data.public}`;
    }
  } catch (err: any) {
    checks["STORAGE_BUCKET"] = `❌ Exception: ${err.message}`;
  }

  return NextResponse.json(checks, { status: 200 });
}

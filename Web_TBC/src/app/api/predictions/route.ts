import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    
    const label = formData.get("label") as string;
    const confidenceStr = formData.get("confidence") as string;
    const rawProbabilityStr = formData.get("raw_probability") as string;
    
    const originalImage = formData.get("original_image") as File;
    const heatmapImageBase64 = formData.get("heatmap_image") as string;
    const superimposedImageBase64 = formData.get("superimposed_image") as string;

    if (!label || !confidenceStr || !rawProbabilityStr || !originalImage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const confidence = parseFloat(confidenceStr);
    const rawProbability = parseFloat(rawProbabilityStr);

    // 3. Initialize Supabase Admin Client
    const supabase = getSupabaseAdminClient();
    const timestamp = Date.now();
    const bucketName = "xray-images";

    // 4. Upload original image
    const origExt = originalImage.name.split('.').pop() || 'png';
    const origPath = `${userId}/${timestamp}_original.${origExt}`;
    const origBuffer = Buffer.from(await originalImage.arrayBuffer());
    
    const { error: origUploadError } = await supabase.storage
      .from(bucketName)
      .upload(origPath, origBuffer, {
        contentType: originalImage.type,
        cacheControl: "3600",
        upsert: true
      });

    if (origUploadError) {
      throw new Error(`Failed to upload original image: ${origUploadError.message}`);
    }

    // Get original image public URL
    const { data: origUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(origPath);
    const originalImageUrl = origUrlData.publicUrl;

    // Helper to upload base64 images
    const uploadBase64Image = async (base64Str: string, suffix: string) => {
      if (!base64Str) return null;
      const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const path = `${userId}/${timestamp}_${suffix}.png`;
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(path, buffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: true
        });

      if (error) {
        throw new Error(`Failed to upload ${suffix} image: ${error.message}`);
      }

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path);
      return data.publicUrl;
    };

    // 5. Upload Grad-CAM heatmaps if provided
    const heatmapImageUrl = await uploadBase64Image(heatmapImageBase64, "heatmap");
    const superimposedImageUrl = await uploadBase64Image(superimposedImageBase64, "superimposed");

    // 6. Save prediction metadata to Database
    const { data: predictionRecord, error: dbError } = await supabase
      .from("predictions")
      .insert({
        user_id: userId,
        original_image_url: originalImageUrl,
        heatmap_image_url: heatmapImageUrl,
        superimposed_image_url: superimposedImageUrl,
        label,
        confidence,
        raw_probability: rawProbability
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to insert prediction: ${dbError.message}`);
    }

    return NextResponse.json({ success: true, prediction: predictionRecord });

  } catch (error: any) {
    console.error("Error in save prediction API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    
    // Fetch predictions for the logged-in user, sorted by created_at descending
    const { data: predictions, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(predictions || []);
  } catch (error: any) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing prediction ID" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Ensure the prediction belongs to the authenticated user
    const { error } = await supabase
      .from("predictions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting prediction:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!image) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    let flaskUrl = process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000";
    // Avoid Gradio's reserved /api route collision by switching to /flask-api
    if (flaskUrl.endsWith("/api")) {
      flaskUrl = flaskUrl.replace(/\/api$/, "/flask-api");
    }
    console.log("Proxying request to Hugging Face backend:", `${flaskUrl}/predict-gradcam`);

    // Create a new FormData object to send to the backend
    const backendFormData = new FormData();
    backendFormData.append("image", image);

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://dosensadasd-tbc-detection-api.hf.space",
      "Referer": "https://dosensadasd-tbc-detection-api.hf.space/",
    };

    if (process.env.HF_ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.HF_ACCESS_TOKEN}`;
    }

    const response = await fetch(`${flaskUrl}/predict-gradcam`, {
      method: "POST",
      headers: headers,
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error response:", errorText);
      return NextResponse.json(
        { error: `AI classification server error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Internal connection error to AI classification server" },
      { status: 500 }
    );
  }
}

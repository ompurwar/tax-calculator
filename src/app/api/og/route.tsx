import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Dynamic OG Image Generator
 * Creates social media preview images with salary information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse parameters
    const title = searchParams.get("title") || "India Tax Calculator";
    const ctc = searchParams.get("ctc");
    const inHand = searchParams.get("inhand");
    const ay = searchParams.get("ay") || "2026-27";
    const hike = searchParams.get("hike");

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0b0f19",
            backgroundImage:
              "radial-gradient(circle at 25px 25px, #1a1f2e 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1f2e 2%, transparent 0%)",
            backgroundSize: "100px 100px",
          }}
        >
          {/* Main Container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px",
              width: "100%",
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: "white",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {title}
            </div>

            {/* Assessment Year Badge */}
            <div
              style={{
                fontSize: 24,
                color: "#60a5fa",
                marginBottom: 40,
                padding: "8px 24px",
                backgroundColor: "#1e3a8a",
                borderRadius: 8,
              }}
            >
              AY {ay} • New Regime
            </div>

            {/* Salary Information */}
            {ctc && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "#18181b",
                  border: "2px solid #3b82f6",
                  borderRadius: 16,
                  padding: "40px 60px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    color: "#9ca3af",
                    marginBottom: 12,
                  }}
                >
                  CTC (Annual)
                </div>
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: "bold",
                    color: "#60a5fa",
                    marginBottom: inHand ? 30 : 0,
                  }}
                >
                  ₹{parseFloat(ctc).toLocaleString("en-IN")}
                </div>

                {inHand && (
                  <>
                    <div
                      style={{
                        fontSize: 32,
                        color: "#4ade80",
                        marginBottom: 8,
                      }}
                    >
                      ↓
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        color: "#9ca3af",
                        marginBottom: 12,
                      }}
                    >
                      In-Hand (Monthly)
                    </div>
                    <div
                      style={{
                        fontSize: 56,
                        fontWeight: "bold",
                        color: "#4ade80",
                      }}
                    >
                      ₹{parseFloat(inHand).toLocaleString("en-IN")}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Hike Badge */}
            {hike && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: parseFloat(hike) >= 0 ? "#4ade80" : "#ef4444",
                  padding: "12px 32px",
                  backgroundColor:
                    parseFloat(hike) >= 0 ? "#14532d" : "#7f1d1d",
                  borderRadius: 8,
                  border:
                    parseFloat(hike) >= 0
                      ? "2px solid #4ade80"
                      : "2px solid #ef4444",
                }}
              >
                {parseFloat(hike) >= 0 ? "+" : ""}
                {parseFloat(hike).toFixed(1)}% Hike
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                position: "absolute",
                bottom: 40,
                fontSize: 18,
                color: "#6b7280",
              }}
            >
              Tax Negotiation Tool • CTC to In-Hand Salary Calculator
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    
    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0b0f19",
            color: "white",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: "bold", marginBottom: 20 }}>
            India Tax Calculator
          </div>
          <div style={{ fontSize: 32, color: "#60a5fa" }}>
            CTC to In-Hand Salary
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}

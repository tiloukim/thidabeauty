import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PAYWAY_MERCHANT_ID = process.env.PAYWAY_MERCHANT_ID || "";
const PAYWAY_API_KEY = process.env.PAYWAY_API_KEY || "";
const PAYWAY_API_URL =
  process.env.PAYWAY_API_URL ||
  "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase";

function generateHash(
  tranId: string,
  amount: string,
  items?: string
): string {
  const str = PAYWAY_MERCHANT_ID + tranId + amount + (items || "");
  const hmac = crypto.createHmac("sha512", PAYWAY_API_KEY);
  hmac.update(str);
  return hmac.digest("base64");
}

export async function POST(req: NextRequest) {
  if (!PAYWAY_MERCHANT_ID || !PAYWAY_API_KEY) {
    return NextResponse.json(
      { error: "PayWay credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const {
      amount,
      firstname,
      lastname,
      phone,
      email,
      items: cartItems,
    } = body as {
      amount: number;
      firstname?: string;
      lastname?: string;
      phone?: string;
      email?: string;
      items?: { name: string; quantity: number; price: number }[];
    };

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const tranId = `TB${Date.now().toString(36).toUpperCase()}`;
    const amountStr = amount.toFixed(2);

    // Encode items if provided
    let itemsEncoded: string | undefined;
    if (cartItems && cartItems.length > 0) {
      itemsEncoded = Buffer.from(JSON.stringify(cartItems)).toString("base64");
    }

    const hash = generateHash(tranId, amountStr, itemsEncoded);

    // Return the form data needed to submit to PayWay
    return NextResponse.json({
      payway_url: PAYWAY_API_URL,
      merchant_id: PAYWAY_MERCHANT_ID,
      tran_id: tranId,
      amount: amountStr,
      hash,
      firstname: firstname || "",
      lastname: lastname || "",
      phone: phone || "",
      email: email || "",
      items: itemsEncoded || "",
    });
  } catch {
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}

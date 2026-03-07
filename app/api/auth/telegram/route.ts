import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

function verifyTelegramAuth(data: TelegramAuthData): boolean {
  if (!BOT_TOKEN) return false;

  const { hash, ...rest } = data;
  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k as keyof typeof rest]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

  if (hmac !== hash) return false;

  // Check auth_date is not older than 1 day
  const now = Math.floor(Date.now() / 1000);
  if (now - data.auth_date > 86400) return false;

  return true;
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json(
      { error: "Telegram bot not configured" },
      { status: 500 }
    );
  }

  try {
    const data = (await req.json()) as TelegramAuthData;

    if (!verifyTelegramAuth(data)) {
      return NextResponse.json(
        { error: "Invalid Telegram authentication" },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const email = `telegram_${data.id}@thidabeauty.com`;
    const fullName =
      [data.first_name, data.last_name].filter(Boolean).join(" ") || "Telegram User";

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password: crypto.randomBytes(32).toString("hex"),
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            telegram_id: data.id,
            telegram_username: data.username || null,
            avatar_url: data.photo_url || null,
          },
        });

      if (createError || !newUser.user) {
        return NextResponse.json(
          { error: createError?.message || "Failed to create user" },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      // Create profile
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: fullName,
        is_admin: false,
      });
    }

    // Generate a magic link for the user to sign in
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: "Failed to generate session" },
        { status: 500 }
      );
    }

    // Extract the token from the link
    const url = new URL(linkData.properties.action_link);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type");

    return NextResponse.json({
      token,
      type,
      email,
      redirect: `/auth/callback?token_hash=${token}&type=${type}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

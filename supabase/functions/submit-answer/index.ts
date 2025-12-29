import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Doğru cevap (backend'de sabit)
const CORRECT_ANSWER = Deno.env.get("CORRECT_ANSWER") || "bahcesehir";

interface SubmitRequest {
  name: string;
  answer: string;
}

const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { name, answer }: SubmitRequest = await req.json();

    console.log(`Yeni cevap alındı: ${name} - ${answer}`);

    // 1. Sayacı artır
    const { data: countData, error: countError } = await supabase
      .from("submission_count")
      .select("count")
      .eq("id", 1)
      .single();

    if (countError && countError.code === "PGRST116") {
      // Kayıt yoksa oluştur
      await supabase.from("submission_count").insert({ id: 1, count: 1 });
    } else if (countData) {
      await supabase
        .from("submission_count")
        .update({ count: countData.count + 1 })
        .eq("id", 1);
    }

    // 2. Cevabı kontrol et (case-insensitive, trim)
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrect = CORRECT_ANSWER.toLowerCase().trim();
    const isCorrect = normalizedAnswer === normalizedCorrect;

    console.log(`Cevap doğru mu: ${isCorrect}`);

    // 3. Cevabı veritabanına kaydet
    await supabase.from("submissions").insert({
      name,
      answer,
      is_correct: isCorrect,
    });

    // 4. Eğer doğruysa e-posta gönder
    if (isCorrect) {
      const smtpHost = Deno.env.get("SMTP_HOST");
      const smtpPort = Deno.env.get("SMTP_PORT");
      const smtpUser = Deno.env.get("SMTP_USER");
      const smtpPass = Deno.env.get("SMTP_PASS");
      const notificationEmail = Deno.env.get("NOTIFICATION_EMAIL");

      if (smtpHost && smtpPort && smtpUser && smtpPass && notificationEmail) {
        try {
          const client = new SMTPClient({
            connection: {
              hostname: smtpHost,
              port: parseInt(smtpPort),
              tls: true,
              auth: {
                username: smtpUser,
                password: smtpPass,
              },
            },
          });

          await client.send({
            from: smtpUser,
            to: notificationEmail,
            subject: "🎉 Yarışmada Doğru Cevap!",
            content: `
Yarışmada doğru cevap verildi!

İsim: ${name}
Cevap: ${answer}
Tarih: ${new Date().toLocaleString("tr-TR")}
            `.trim(),
          });

          await client.close();
          console.log("E-posta başarıyla gönderildi");
        } catch (emailError) {
          console.error("E-posta gönderme hatası:", emailError);
        }
      } else {
        console.log("SMTP ayarları eksik, e-posta gönderilmedi");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Yanıtınız gönderildi" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Hata:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

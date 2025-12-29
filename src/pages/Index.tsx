import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

const Index = () => {
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [count, setCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sayacı al
  const fetchCount = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-count");
      if (!error && data) {
        setCount(data.count);
      }
    } catch (err) {
      console.error("Sayaç alınamadı:", err);
    }
  };

  useEffect(() => {
    fetchCount();
    // Her 10 saniyede güncelle
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !answer.trim()) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-answer", {
        body: { name: name.trim(), answer: answer.trim() },
      });

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
      setCount((prev) => prev + 1);
      toast.success("Yanıtınız gönderildi!");
    } catch (err: any) {
      console.error("Gönderim hatası:", err);
      toast.error("Bir hata oluştu, lütfen tekrar deneyin");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bah%C3%A7e%C5%9Fehir_%C3%9Cniversitesi_logo.svg/1200px-Bah%C3%A7e%C5%9Fehir_%C3%9Cniversitesi_logo.svg.png"
          alt="Bahçeşehir Üniversitesi"
          className="h-20 mx-auto mb-4"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <h1 className="text-3xl font-bold text-primary mb-2">
          Yarışma
        </h1>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
          <i className="fa-solid fa-users"></i>
          <span className="font-semibold">
            Şu ana kadar <span className="text-xl">{count}</span> kişi cevap gönderdi
          </span>
        </div>
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-md shadow-lg border-2 border-primary/20 animate-fade-in">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-question-circle text-2xl"></i>
            <div>
              <h2 className="text-xl font-bold">Soruyu Yanıtla</h2>
              <p className="text-sm opacity-90">Cevabınızı aşağıya yazın</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <i className="fa-solid fa-user mr-2 text-primary"></i>
                  İsim Soyisim
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınızı ve soyadınızı girin"
                  className="border-2 focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  <i className="fa-solid fa-lightbulb mr-2 text-primary"></i>
                  Cevabınız
                </label>
                <Input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Cevabınızı yazın"
                  className="border-2 focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane mr-2"></i>
                    Gönder
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-check text-3xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Yanıtınız Gönderildi!
              </h3>
              <p className="text-muted-foreground">
                Katılımınız için teşekkür ederiz.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground text-center">
        <i className="fa-solid fa-shield-halved mr-1"></i>
        Bilgileriniz güvenle saklanmaktadır.
      </p>
    </div>
  );
};

export default Index;

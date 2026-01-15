import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { supabase } from "../utils/supabase";

const logoImage = 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png';

interface LoginScreenProps {
  onLogin: (username: string, name: string, userId: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // استدعاء دالة تسجيل الدخول (parameters alphabetically!)
      const { data, error: rpcError } = await supabase
        .rpc('login_user', {
          p_password: password,
          p_username: username
        });

      if (rpcError) {
        console.error('Login RPC error:', rpcError);
        setError("حدث خطأ، الرجاء المحاولة مرة أخرى");
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (!data?.success || !data?.user) {
        setError("فشل تسجيل الدخول");
        setLoading(false);
        return;
      }

      // حفظ token في localStorage
      localStorage.setItem('nooruna_token', data.token);
      
      // Fix: Save with userId field consistently
      const userToStore = {
        id: data.user.id,
        userId: data.user.id, // Duplicate for consistency
        username: data.user.username,
        name: data.user.name
      };
      localStorage.setItem('nooruna_user', JSON.stringify(userToStore));

      onLogin(data.user.username, data.user.name, data.user.id);
    } catch (err) {
      setError("حدث خطأ، الرجاء المحاولة مرة أخرى");
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // التحققات الأساسية
    if (username.length < 3) {
      setError("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      setLoading(false);
      return;
    }

    if (name.trim().length < 2) {
      setError("الرجاء إدخال الاسم الكامل");
      setLoading(false);
      return;
    }

    try {
      // استدعاء دالة إنشاء المستخدم
      const { data, error: rpcError } = await supabase
        .rpc('register_user', {
          p_username: username,
          p_password: password,
          p_name: name.trim()
        });

      if (rpcError) {
        console.error('Signup RPC error:', rpcError);
        setError("حدث خطأ أثناء إنشاء الحساب");
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (!data?.success || !data?.user) {
        setError("فشل في إنشاء الحساب");
        setLoading(false);
        return;
      }

      console.log("✅ User created successfully:", data.user);

      // حفظ token في localStorage
      localStorage.setItem('nooruna_token', data.token);
      
      // Fix: Save with userId field consistently
      const userToStore = {
        id: data.user.id,
        userId: data.user.id, // Duplicate for consistency
        username: data.user.username,
        name: data.user.name
      };
      localStorage.setItem('nooruna_user', JSON.stringify(userToStore));

      onLogin(data.user.username, data.user.name, data.user.id);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء الحساب");
      console.error('Signup error:', err);
      setLoading(false);
    }
  };

  const handleSubmit =
    mode === "login" ? handleLogin : handleSignup;

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src={logoImage}
              alt="نورنا"
              className="w-20 h-20 rounded-2xl shadow-2xl"
            />
          </div>
          <div className="text-center">
            <h1 className="font-bold text-3xl text-foreground">
              نورنا
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              حب يضيء بالإيمان
            </p>
          </div>
        </div>

        <div className="relative bg-card rounded-3xl shadow-2xl p-8 border border-border/50">
          <div className="flex gap-2 mb-6 bg-secondary/30 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-2 px-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                mode === "login"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 py-2 px-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                mode === "signup"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  الاسم الكامل
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="مثال: نور"
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-2"
              >
                اسم المستخدم
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().trim(),
                  )
                }
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder={
                  mode === "signup"
                    ? "اختر اسم مستخدم"
                    : "أدخل اسم المستخدم"
                }
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              ) : mode === "login" ? (
                <>
                  <LogIn className="w-5 h-5" /> تسجيل الدخول
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> إنشاء حساب
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
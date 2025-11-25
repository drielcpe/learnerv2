"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, QrCode, Scan } from "lucide-react";

type LoginType = "admin" | "qr";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>("admin");

  // Admin login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // QR login state
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);

  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "admin") router.replace("/admin/dashboard");
    else if (role === "secretary") router.replace("/student/dashboard");
    else if (role === "student") router.replace("/student/dashboard");
  }, [router]);

  // ---------------- ADMIN LOGIN ----------------
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "admin" }),
      });
      const result = await res.json();

      if (!result.success) throw new Error(result.error || "Login failed");

      const userData = result.data;
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("userData", JSON.stringify(userData));
      
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setAdminLoading(false);
    }
  };

  // ---------------- QR LOGIN ----------------
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return;
    }
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
    setError("");
  };

 const handleQrLogin = async () => {
  if (!qrFile) return setError("Please upload a QR code");

  setQrLoading(true);
  setError("");

  try {
    const formData = new FormData();
    formData.append("qrCode", qrFile);

    const res = await fetch("/api/auth/qr-login", { method: "POST", body: formData });
    const data = await res.json();

    // DEBUG: log the returned data
    console.log("QR login response data:", data);

    if (!res.ok || !data.success) throw new Error(data.error || "QR login failed");

    // Store userData
    const userData = data.data;
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("userRole",  "student");

    // Extract studentId and studentName from userData
    localStorage.setItem("studentId", userData.studentId || userData.student_id || "");
    localStorage.setItem("studentName", userData.studentName || userData.student_name || "");

    // Redirect based on role
    if (userData.role === "student") router.push("/student/dashboard");
    else if (userData.role === "secretary") router.push("/student/dashboard");
    else throw new Error("Unknown role");

  } catch (err: unknown) {
    console.error("QR login error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    setError(msg || "Failed to login via QR");
  } finally {
    setQrLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Choose your login method to continue</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          <Tabs value={loginType} onValueChange={(value) => { setLoginType(value as LoginType); setError(""); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" /> Admin
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" /> QR Login
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={adminLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={adminLoading}
                  />
                </div>
                <Button className="w-full" type="submit" disabled={adminLoading}>
                  {adminLoading ? "Signing in..." : "Sign in as Admin"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4">
              <div className="text-center space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900">QR Code Login</h3>
                  <p className="text-sm text-blue-700 mt-1">Upload your QR code to login</p>
                </div>

                {qrPreview && (
                  <div className="text-center">
                    <Image
                      src={qrPreview}
                      alt="QR Preview"
                      width={200}
                      height={200}
                      className="mx-auto border rounded-lg"
                      priority
                    />
                    <p className="text-sm text-green-600 mt-1">QR Code loaded successfully</p>
                  </div>
                )}

                <Label htmlFor="qr-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                    <Scan className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{qrFile ? "Change QR Code" : "Click to upload QR Code"}</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG supported</p>
                  </div>
                </Label>
                <Input
                  id="qr-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                  disabled={qrLoading}
                />
                <Button className="w-full" onClick={handleQrLogin} disabled={!qrFile || qrLoading}>
                  {qrLoading ? "Verifying QR Code..." : "Login with QR Code"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { decodeQRCodeFromBuffer, parseStudentData } from "@/utils/qr-decoder";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role, studentId, qrCode } = body;

    // -------------------
    // Admin login
    // -------------------
    if (role === "admin") {
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: "Email and password are required for admin login" },
          { status: 400 }
        );
      }

      const admins = await query(
        "SELECT * FROM admins WHERE email = ? AND is_active = TRUE",
        [email]
      );

      if (!admins.length) {
        return NextResponse.json({ success: false, error: "Invalid admin credentials" }, { status: 401 });
      }

      const admin = admins[0];

      // Plain-text password check
      if (password !== admin.password) {
        return NextResponse.json({ success: false, error: "Invalid admin credentials" }, { status: 401 });
      }

      // Update last login
      await query("UPDATE admins SET last_login = NOW() WHERE id = ?", [admin.id]);

      return NextResponse.json({
        success: true,
        data: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "admin",
          permissions: admin.permissions ? JSON.parse(admin.permissions) : [],
        },
        redirect: "/admin/dashboard",
        message: "Admin login successful",
      });
    }

    // -------------------
    // Student / Secretary login
    // -------------------
    if (role === "student" || role === "secretary") {
      let idToLookup = studentId;

      // Decode QR code if provided
      if (qrCode) {
        try {
          const buffer = Buffer.from(qrCode.data); // qrCode sent as File/binary
          const qrContent = await decodeQRCodeFromBuffer(buffer);
          const studentData = parseStudentData(qrContent);
          idToLookup = studentData.student_id;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return NextResponse.json(
            { success: false, error: "Failed to decode QR code: " + msg },
            { status: 400 }
          );
        }
      }

      if (!idToLookup) {
        return NextResponse.json(
          { success: false, error: "Student ID or QR code is required" },
          { status: 400 }
        );
      }

      const users = await query(
        'SELECT * FROM students WHERE student_id = ? AND status = "ACTIVE"',
        [idToLookup]
      );

      if (!users.length) {
        return NextResponse.json({ success: false, error: "User not found or inactive" }, { status: 401 });
      }

      const user = users[0];

      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          student_id: user.student_id,
          student_name: user.student_name,
          grade: user.grade,
          section: user.section,
          adviser: user.adviser,
          role: user.student_type, // "student" or "secretary"
          student_type: user.student_type,
        },
        redirect: "/student/dashboard",
        message: "Login successful",
      });
    }

    // Invalid role
    return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + msg },
      { status: 500 }
    );
  }
}

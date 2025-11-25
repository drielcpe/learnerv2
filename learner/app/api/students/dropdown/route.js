// app/api/students/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateStudentQRCode } from '@/app/admin/student-management/utils/qr-generator';

export async function GET() {
  try {
    console.log('📥 Fetching all students from database...');
    
    const students = await query(`
      SELECT 
        id,
        student_id,
        student_name,
        grade,
        section,
        adviser,
        contact_number,
        email,
        address,
        birth_date,
        qr_code,
        status,
        created_at,
        updated_at
      FROM students 
      
      WHERE status != 'INACTIVE'
      ORDER BY student_name
    `);
    
    console.log(`✅ Found ${students.length} students`);

    const formatDate = (date) => {
      if (!date) return null;
      if (typeof date === 'string') return date.split('T')[0];
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return null;
    };

    const formatDateTime = (date) => {
      if (!date) return new Date().toISOString();
      if (typeof date === 'string') return new Date(date).toISOString();
      if (date instanceof Date) return date.toISOString();
      return new Date().toISOString();
    };

    const formattedStudents = students.map(student => ({
      ...student,
      id: student.id.toString(),
      contact_number: student.contact_number || "",
      email: student.email || "",
      address: student.address || "",
      birth_date: formatDate(student.birth_date),
      qr_code: student.qr_code || null,
      enrollment_date: formatDate(student.created_at),
      created_at: formatDateTime(student.created_at),
      updated_at: formatDateTime(student.updated_at),
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: formattedStudents 
    });
    
  } catch (error) {
    console.error('❌ Students fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}


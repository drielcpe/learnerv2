// app/api/students/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateStudentQRCode } from '@/app/admin/utils/qr-generator';

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
        student_type,
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

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📦 Creating student with data:', body);
    
    const requiredFields = ['student_id', 'student_name', 'grade', 'section'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Check for duplicate student_id
    const existingStudents = await query(
      'SELECT id FROM students WHERE student_id = ?',
      [body.student_id]
    );
    
    if (existingStudents.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID already exists' 
      }, { status: 400 });
    }

    // Insert student
    const result = await query(
      `INSERT INTO students (
        student_id, student_name, grade, section, adviser, 
        contact_number, email, address, birth_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.student_id,
        body.student_name,
        body.grade,
        body.section,
        body.adviser || null,
        body.contact_number || null,
        body.email || null,
        body.address || null,
        body.birth_date || null,
        body.status || 'ACTIVE'
      ]
    );

    // Get the newly created student
    const [newStudent] = await query(
      'SELECT * FROM students WHERE id = ?',
      [result.insertId]
    );

    // Generate QR code for the student
    let qrCodePath = null;
    try {
      qrCodePath = await generateStudentQRCode(newStudent);
      
      // Update student with QR code path
      await query(
        'UPDATE students SET qr_code = ? WHERE id = ?',
        [qrCodePath, newStudent.id]
      );
      
      newStudent.qr_code = qrCodePath;
    } catch (qrError) {
      console.warn('⚠️ QR code generation failed:', qrError);
      // Continue without QR code - student creation should not fail because of QR
    }

    const formatDate = (date) => {
      if (!date) return null;
      if (typeof date === 'string') return date.split('T')[0];
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return null;
    };

    const formattedStudent = {
      ...newStudent,
      id: newStudent.id.toString(),
      contact_number: newStudent.contact_number || "",
      email: newStudent.email || "",
      address: newStudent.address || "",
      birth_date: formatDate(newStudent.birth_date),
      qr_code: qrCodePath,
      enrollment_date: formatDate(newStudent.created_at),
    };

    return NextResponse.json({ 
      success: true, 
      data: formattedStudent,
      message: 'Student created successfully' + (qrCodePath ? ' with QR code' : '')
    });
    
  } catch (error) {
    console.error('❌ Student creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
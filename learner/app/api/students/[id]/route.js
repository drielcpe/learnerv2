// app/api/students/[id]/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    // Get the ID from params - no need to await in this structure
    const { id } = params;
    
    console.log('🆔 Received update request for student ID:', id);
    console.log('📋 Params object:', params);

    const body = await request.json();
    console.log('📝 Update data:', body);

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required' 
      }, { status: 400 });
    }

    // First, check if student exists
    console.log('🔍 Checking if student exists with ID:', id);
    const [existingStudent] = await query(
      'SELECT id FROM students WHERE id = ?',
      [id]
    );

    console.log('📊 Existing student query result:', existingStudent);

    if (!existingStudent) {
      console.log('❌ Student not found in database');
      return NextResponse.json({ 
        success: false, 
        error: `Student not found with ID: ${id}` 
      }, { status: 404 });
    }

    console.log('✅ Student found, proceeding with update');

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'student_name', 'grade', 'section', 'adviser', 
      'contact_number', 'email', 'address', 'birth_date', 'status'
    ];

    allowedFields.forEach(field => {
      if (field in body) {
        updateFields.push(`${field} = ?`);
        // Handle empty strings by converting to null
        updateValues.push(body[field] === '' ? null : body[field]);
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid fields to update' 
      }, { status: 400 });
    }

    updateValues.push(id);

    const queryString = `
      UPDATE students 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    console.log('🔄 Executing query:', queryString);
    console.log('📊 With values:', updateValues);

    const result = await query(queryString, updateValues);
    console.log('✅ Update query result:', result);

    // Fetch the updated student
    const [updatedStudent] = await query(
      `SELECT 
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
      FROM students WHERE id = ?`,
      [id]
    );

    console.log('📋 Updated student data:', updatedStudent);

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

    const formattedStudent = {
      ...updatedStudent,
      id: updatedStudent.id.toString(),
      contact_number: updatedStudent.contact_number || "",
      email: updatedStudent.email || "",
      address: updatedStudent.address || "",
      birth_date: formatDate(updatedStudent.birth_date),
      qr_code: updatedStudent.qr_code || null,
      enrollment_date: formatDate(updatedStudent.created_at),
      created_at: formatDateTime(updatedStudent.created_at),
      updated_at: formatDateTime(updatedStudent.updated_at),
    };

    console.log('🎉 Student updated successfully');

    return NextResponse.json({ 
      success: true, 
      data: formattedStudent,
      message: 'Student updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Student update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    console.log('📥 Fetching student with ID:', id);

    const [student] = await query(
      `SELECT 
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
      FROM students WHERE status != 'DELETED'`,
      [id]
    );

    if (!student) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found' 
      }, { status: 404 });
    }

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

    const formattedStudent = {
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
    };

    return NextResponse.json({ 
      success: true, 
      data: formattedStudent 
    });
    
  } catch (error) {
    console.error('❌ Student fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
// Soft delete approach (recommended)
// app/api/students/[id]/route.js

export async function DELETE(request, context) {
  try {
    // Get the ID from context params
    const { params } = context;
    const id = params.id;
    
    console.log('🗑️ DELETE request received for student ID:', id);
    console.log('📋 Full params:', params);

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required' 
      }, { status: 400 });
    }

    // Check if student exists
    const [existingStudent] = await query(
      'SELECT id FROM students WHERE id = ?',
      [id]
    );

    if (!existingStudent) {
      console.log('❌ Student not found with ID:', id);
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found' 
      }, { status: 404 });
    }

    console.log('✅ Student found, proceeding with deletion');

    // Soft delete - change status to DELETED
    const result = await query(
      'UPDATE students SET status = ? WHERE id = ?',
      ['DELETED', id]
    );

    console.log('✅ Student soft deleted successfully, result:', result);

    return NextResponse.json({ 
      success: true,
      message: 'Student deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Student deletion error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

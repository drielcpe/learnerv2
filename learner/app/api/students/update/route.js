// app/api/students/update/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    console.log('🆔 Received update request for student ID:', id);
    console.log('📝 Update data:', updateData);

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required' 
      }, { status: 400 });
    }

    // First, check if student exists
    const [existingStudent] = await query(
      'SELECT id FROM students WHERE id = ?',
      [id]
    );

    if (!existingStudent) {
      return NextResponse.json({ 
        success: false, 
        error: `Student not found with ID: ${id}` 
      }, { status: 404 });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'student_name', 'grade', 'section', 'adviser', 
      'contact_number', 'email', 'address', 'birth_date', 'status','student_type'
    ];

    allowedFields.forEach(field => {
      if (field in updateData) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field] === '' ? null : updateData[field]);
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

    await query(queryString, updateValues);

    // Fetch the updated student
    const [updatedStudent] = await query(
      `SELECT * FROM students WHERE id = ?`,
      [id]
    );

    const formatDate = (date) => {
      if (!date) return null;
      if (typeof date === 'string') return date.split('T')[0];
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return null;
    };

    const formattedStudent = {
      ...updatedStudent,
      id: updatedStudent.id.toString(),
      contact_number: updatedStudent.contact_number || "",
      email: updatedStudent.email || "",
      address: updatedStudent.address || "",
      birth_date: formatDate(updatedStudent.birth_date),
      enrollment_date: formatDate(updatedStudent.created_at),
    };

    return NextResponse.json({ 
      success: true, 
      data: formattedStudent,
      message: 'Student updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Student update error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
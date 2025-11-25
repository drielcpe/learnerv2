// app/api/students/delete/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
  try {
    // Get ID from request body instead of params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('🗑️ DELETE request received for student ID:', id);

    if (!id) {
      console.log('❌ No student ID provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID is required' 
      }, { status: 400 });
    }

    // Check if student exists
    console.log('🔍 Checking if student exists with ID:', id);
    const [existingStudent] = await query(
      'SELECT id, student_id, student_name FROM students WHERE id = ?',
      [id]
    );

    if (!existingStudent) {
      console.log('❌ Student not found with ID:', id);
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found' 
      }, { status: 404 });
    }

    console.log('✅ Student found:', existingStudent.student_name, 'proceeding with deletion');

    // Soft delete - change status to DELETED
    const result = await query(
      'DELETE students WHERE id = ?',
      ['DELETED', id]
    );

    console.log('✅ Student soft deleted successfully');

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
// app/student-management/utils/qr-generator.js
import QRCode from 'qrcode';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function generateStudentQRCode(student) {
  try {
    // Enhanced QR data with more student information
    const qrData = JSON.stringify({
      student_id: student.student_id,
      student_name: student.student_name,
      grade: student.grade,
      section: student.section,
      adviser: student.adviser,
      id: student.id,
      type: 'student_identification',
      timestamp: new Date().toISOString()
    });

    // Create QR codes directory
    const qrDir = path.join(process.cwd(), 'public', 'qr-codes');
    await mkdir(qrDir, { recursive: true });

    // Generate QR code filename
    const filename = `student_${student.student_id}_${Date.now()}.png`;
    const filepath = path.join(qrDir, filename);

    // Generate QR code with school branding colors
    await QRCode.toFile(filepath, qrData, {
      color: {
        dark: '#1e40af', // Blue color
        light: '#ffffff'
      },
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H' // High error correction
    });

    console.log(`✅ QR code generated for ${student.student_name}: ${filename}`);
    return `/qr-codes/${filename}`;
    
  } catch (error) {
    console.error('❌ QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Batch generate QR codes for existing students
export async function generateQRForAllStudents() {
  try {
    const { query } = await import('@/lib/db');
    const students = await query('SELECT * FROM students WHERE qr_code IS NULL');
    
    console.log(`🔄 Generating QR codes for ${students.length} students...`);
    
    for (const student of students) {
      try {
        const qrPath = await generateStudentQRCode(student);
        await query('UPDATE students SET qr_code = ? WHERE id = ?', [qrPath, student.id]);
        console.log(`✅ QR generated for ${student.student_name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to generate QR for ${student.student_name}:`, error.message);
      }
    }
    
    console.log('🎉 QR code generation completed!');
  } catch (error) {
    console.error('❌ Batch QR generation error:', error);
  }
}
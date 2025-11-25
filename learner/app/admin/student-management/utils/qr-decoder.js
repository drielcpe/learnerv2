import jsQR from 'jsqr';
import sharp from 'sharp';

export async function decodeQRCodeFromBuffer(imageBuffer) {
  try {
    console.log('🔍 Decoding QR code from buffer, size:', imageBuffer.length);
    
    // Convert image to raw RGB data using sharp
    const { data, info } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create ImageData-like object for jsQR
    const imageData = {
      data: new Uint8ClampedArray(data),
      width: info.width,
      height: info.height
    };

    // Decode QR code
    const decoded = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (decoded) {
      console.log('✅ QR code decoded successfully:', decoded.data);
      return decoded.data;
    } else {
      throw new Error('No QR code found in image');
    }
    
  } catch (error) {
    console.error('❌ QR code decoding error:', error);
    throw new Error('Failed to decode QR code: ' + error.message);
  }
}

// Function to parse the student data from QR content
export function parseStudentData(qrContent) {
  try {
    console.log('📄 Parsing QR content:', qrContent);
    
    // Try to parse as JSON (your current format)
    try {
      const studentData = JSON.parse(qrContent);
      
      // Validate required fields
      if (studentData.student_id && studentData.student_name) {
        console.log('✅ QR contains valid student data:', studentData);
        return {
          student_id: studentData.student_id,
          student_name: studentData.student_name,
          grade: studentData.grade,
          section: studentData.section,
          adviser: studentData.adviser,
          id: studentData.id,
          type: studentData.type,
          source: 'json'
        };
      }
    } catch (jsonError) {
      console.log('📄 QR content is not JSON, trying text format...');
    }
    
    // Try to parse as text format (STUDENT:ID:NAME format)
    if (qrContent.includes('STUDENT:')) {
      const parts = qrContent.split(':');
      if (parts.length >= 3) {
        const studentData = {
          student_id: parts[1],
          student_name: parts[2] || 'Unknown Student',
          source: 'text'
        };
        console.log('✅ QR contains text student data:', studentData);
        return studentData;
      }
    }
    
    // If it's just a student ID
    if (qrContent.match(/^[a-zA-Z0-9]+$/)) {
      const studentData = {
        student_id: qrContent,
        student_name: 'Unknown Student',
        source: 'id_only'
      };
      console.log('✅ QR contains student ID only:', studentData);
      return studentData;
    }
    
    throw new Error('Invalid QR code format: ' + qrContent.substring(0, 50));
    
  } catch (error) {
    console.error('❌ QR content parsing error:', error);
    throw new Error('Could not parse QR code content: ' + error.message);
  }
}
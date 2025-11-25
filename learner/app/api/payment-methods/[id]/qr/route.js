import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    console.log('🔍 Fetching QR image for method:', id);
    
    const result = await query(`
      SELECT 
        qr_code_data,
        qr_code_mimetype
      FROM payment_methods 
      WHERE id = ? AND has_qr = TRUE AND qr_code_data IS NOT NULL
    `, [id]);

    console.log('📊 QR image query result:', {
      found: result.length > 0,
      hasData: result[0]?.qr_code_data ? 'YES' : 'NO'
    });

    if (result.length === 0 || !result[0].qr_code_data) {
      console.log('❌ QR code not found');
      // Return SVG placeholder
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24">
        <rect width="24" height="24" fill="#f3f4f6"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              font-family="monospace" font-size="8" fill="#9ca3af">No QR Code</text>
      </svg>`;
      
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      });
    }

    const qrData = result[0];
    
    // Return the actual image data
    return new Response(qrData.qr_code_data, {
      headers: {
        'Content-Type': qrData.qr_code_mimetype || 'image/jpeg',
        'Content-Length': qrData.qr_code_data.length.toString(),
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('❌ QR endpoint error:', error);
    
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#fef2f2"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="monospace" font-size="6" fill="#dc2626">Error</text>
    </svg>`;
    
    return new Response(errorSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache'
      }
    });
  }
}
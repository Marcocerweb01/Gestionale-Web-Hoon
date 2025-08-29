import { autoRecoveryCheck } from '../../../utils/snapshotVerification.js';

// API per controllo automatico consistenza
export async function GET() {
  try {
    const result = await autoRecoveryCheck();
    
    return Response.json({
      success: true,
      consistent: result.consistent,
      fixed: result.fixed,
      reason: result.reason,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Permetti anche POST per test manuali
export const POST = GET;

import { NextResponse } from 'next/server';
import {
  getCurrentUser,
  invalidateUserTokens,
  clearAuthCookie,
} from '@/lib/super-admin-auth';

export async function POST() {
  try {
    // Get current user to invalidate their tokens
    const user = await getCurrentUser();

    if (user) {
      // Invalidate all tokens for this user (increment token version)
      invalidateUserTokens(user.userId);
    }

    // Clear the auth cookie
    await clearAuthCookie();

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

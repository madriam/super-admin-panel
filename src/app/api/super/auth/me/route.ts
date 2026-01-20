import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/super-admin-auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Return only non-sensitive user info
    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Erro ao obter usuario' },
      { status: 500 }
    );
  }
}

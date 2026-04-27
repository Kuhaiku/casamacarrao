// app/api/settings/music/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (!file.type.includes('audio/')) {
      return NextResponse.json({ error: 'O arquivo deve ser um áudio (mp3).' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salva o arquivo na pasta public/ do projeto como bg-music.mp3
    const publicPath = path.join(process.cwd(), 'public', 'bg-music.mp3');
    
    await fs.writeFile(publicPath, buffer);

    return NextResponse.json({ success: true, url: '/bg-music.mp3' });
  } catch (error) {
    console.error('Erro no upload da música:', error);
    return NextResponse.json({ error: 'Erro ao salvar o arquivo.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getConfig, setConfig, setHeroMedia, setLogos } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error("Config GET Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, files } = body;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    let filePaths = [];
    if (files && Array.isArray(files)) {
      for (const file of files) {
        const matches = file.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1].split('/')[1] || 'png';
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `${uuidv4()}.${ext}`;
          const filePath = path.join(uploadsDir, filename);
          await fs.writeFile(filePath, buffer);
          filePaths.push(`/uploads/${filename}`);
        }
      }
    }

    if (type && type.startsWith('logo_')) {
      const logoKey = type.split('_')[1]; // sih, ksv, vsitr
      if (['sih', 'ksv', 'vsitr'].includes(logoKey)) {
        const currentLogos = (await getConfig()).logos || {};
        if (filePaths[0]) currentLogos[logoKey] = filePaths[0];
        await setLogos(currentLogos);
      }
    } else if (type === 'heroMedia' && filePaths.length > 0) {
      await setHeroMedia(filePaths);
    } else if (type === 'timerConfig') {
      const { deadline, heading, buttonText, buttonLink, footerText } = body;
      if (deadline !== undefined) await setConfig('deadline', deadline);
      if (heading !== undefined) await setConfig('registrationHeading', heading);
      if (buttonText !== undefined) await setConfig('registrationButtonText', buttonText);
      if (buttonLink !== undefined) await setConfig('registrationButtonLink', buttonLink);
      if (footerText !== undefined) await setConfig('registrationFooterText', footerText);
    }

    const updatedConfig = await getConfig();
    return NextResponse.json({ success: true, config: updatedConfig }, { status: 200 });
  } catch (error) {
    console.error("Config POST Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

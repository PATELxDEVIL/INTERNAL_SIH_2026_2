import { NextResponse } from 'next/server';
import { getConfig, setConfig, setHeroMedia, setLogos } from '@/lib/db';

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
    let filePaths = [];
    if (files && Array.isArray(files)) {
      // Store the raw base64 string directly in the database
      // since Vercel serverless functions have a read-only filesystem.
      for (const file of files) {
        if (file.data) {
          filePaths.push(file.data);
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

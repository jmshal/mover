import { posix } from 'https://deno.land/std@0.170.0/path/mod.ts';
import { read } from 'https://deno.land/x/streaming_zip@v1.0.1/read.ts';

const [relativePath, addr] = Deno.args;

const currentPath = new URL('.', import.meta.url).pathname;
const absolutePath = posix.resolve(currentPath, relativePath);

const listenUrl = new URL(addr);
const cachedFolderPaths: { [folderPath: string]: true } = {};

await Deno.serve(async (request) => {
  const body = request.body;

  if (!body) {
    return new Response('Bad Request', { status: 400 });
  }

  try {
    for await (const entry of read(request.body, { signal: request.signal })) {
      if (entry.type === 'file') {
        const absoluteFilePath = posix.resolve(absolutePath, entry.name);
        const absoluteFolderPath = posix.dirname(absoluteFilePath);

        if (!cachedFolderPaths[absoluteFolderPath]) {
          await Deno.mkdir(absoluteFolderPath, { recursive: true });
          cachedFolderPaths[absoluteFolderPath] = true;
        }

        console.log(`-> ${entry.name} (${entry.originalSize}, ${entry.crc.toString(16)})`);
        const file = await Deno.open(absoluteFilePath, { create: true, write: true });
        await entry.body.stream().pipeTo(file.writable, { signal: request.signal });
      }
    }
  } catch (err) {
    return new Response(`${err}`, { status: 500 });
  }

  return new Response('OK');
}, {
  hostname: listenUrl.hostname,
  port: +listenUrl.port,
  onListen: () => {
    console.log(`Listening on ${listenUrl.hostname}:${listenUrl.port}...`);
  },
});

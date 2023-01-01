import { posix, relative } from 'https://deno.land/std@0.170.0/path/mod.ts';
import { walk } from 'https://deno.land/std@0.170.0/fs/mod.ts';
import { write, WriteEntry } from 'https://deno.land/x/streaming_zip@v1.0.1/write.ts';
import { Crc32Stream } from 'https://deno.land/x/crc32@v0.2.2/mod.ts';

const [relativePath, addr] = Deno.args;

const currentPath = new URL('.', import.meta.url).pathname;
const absolutePath = posix.resolve(currentPath, relativePath);

async function getCrc32(filePath: string): Promise<string> {
  const crc = new Crc32Stream();
  const file = await Deno.open(filePath, { read: true });
  for await (const chunk of file.readable) {
    crc.append(chunk);
  }
  return crc.crc32;
}

async function* getFiles(): AsyncGenerator<WriteEntry> {
  for await (const entry of walk(absolutePath)) {
    if (entry.isFile) {
      const relativeFilePath = relative(absolutePath, entry.path);
      const crc = await getCrc32(entry.path);
      const stat = await Deno.stat(entry.path);
      const file = await Deno.open(entry.path);
      console.log(`-> ${relativeFilePath} (${stat.size}, ${crc})`);
      yield {
        name: relativeFilePath,
        type: 'file',
        extendedTimestamps: {
          accessTime: stat.atime ?? undefined,
          createTime: stat.birthtime ?? undefined,
          modifyTime: stat.mtime ?? undefined,
        },
        body: {
          stream: file.readable,
          originalSize: stat.size,
          originalCrc: parseInt(crc, 16),
        },
      };
    }
  }
}

const reader = write(getFiles());

const response = await fetch(addr, {
  method: 'POST',
  body: reader,
});

console.log(response.status);
console.log(await response.text());

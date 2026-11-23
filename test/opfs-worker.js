const mem = {};

self.onmessage = (event) =>
  Promise.resolve().then((_) => {
    const { data } = event;
    const {
      dirName,
      payload,
      fileName,
    } = data;

    let handle;

    return navigator.storage.getDirectory()
      .then((rt) => {
        return rt.getDirectoryHandle(dirName, { create: true })
          .then((dir) => [rt, dir]);
      })
      .then((pair) => {
        const [rt, dir] = pair;
        return dir.getFileHandle(fileName, { create: true })
          .then((file) => [rt, dir, file]);
      })
      .then((rdf) => {
        const [rt, dir, file] = rdf;
        return file.createSyncAccessHandle()
          .then((hndl) => [rt, dir, file, hndl]);
      })
      .then((rdfh) => {
        const [rt, dir, file, hndl] = rdfh;
        handle = hndl;

        hndl.truncate(0);
        hndl.write(
          new Uint8Array([
            0,
            1,
            2,
            3, // 0x00: dummy frame 0
            4,
            5,
            6,
            7, // 0x04: dummy frame 1
            0x5e,
            0x2a,
            0x4d,
            0x18, // 0x08: skippable frame header
            0x21,
            0,
            0,
            0, // 0x0c: the size of the table
            1,
            0,
            0,
            0, // 0x10: dummy compressed size 0
            2,
            0,
            0,
            0, // 0x14: dummy original size 0
            3,
            0,
            0,
            0, // 0x18: dummy compressed size 1
            4,
            0,
            0,
            0, // 0x1c: dummy original size 1
            2,
            0,
            0,
            0, // 0x20: number of frames
            0, // 0x24: no checksum
            0xb1,
            0xea,
            0x92,
            0x8f, // 0x25: magic number
          ]),
          { at: 0 },
        );
        hndl.flush();

        const toffset = 0x20;

        return WebAssembly.instantiateStreaming(
          fetch(new URL("./zeek2fcnt.wasm", import.meta.url)),
          {
            env: {
              read_trailer: (ptr) => {
                if (!mem.wasmMem) return -1;

                const view = new Uint8Array(
                  mem.wasmMem.buffer,
                  ptr,
                  9,
                );
                return hndl.read(view, { at: toffset });
              },
            },
          },
        )
          .then((i) => [rt, dir, file, hndl, i]);
      })
      .then((rdfhi) => {
        const [rt, dir, file, hndl, wasm] = rdfhi;

        const { instance } = wasm;
        const { exports } = instance;
        const { io_trailer2num_frames } = exports;

        mem.wasmMem = exports.memory;

        const numFrames = io_trailer2num_frames();

        const ok = 2 == numFrames;
        if (ok) {
          return self.postMessage({
            ok,
          });
        }

        self.postMessage({
          ok,
          msg: new Error(`expected: 2, got: ${numFrames}`),
        });
      })
      .catch((err) => {
        self.postMessage({
          ok: false,
          msg: `failure: ${err}`,
        });
      })
      .finally((_) => {
        if (!handle) return;
        handle.close();
      });
  });

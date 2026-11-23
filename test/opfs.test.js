describe("OPFS storage ops", () => {
  let opfsDir;
  let testDir;

  let dirName;

  beforeEach(() => {
    return navigator.storage.getDirectory()
      .then((rt) => {
        opfsDir = rt;
        dirName = `test-${crypto.randomUUID()}`;
        return rt.getDirectoryHandle(dirName, { create: true });
      })
      .then((neod) => {
        testDir = neod;
        console.warn(`the dir ${dirName} created.`);
        return;
      });
  });

  afterEach(() => {
    const foundDir = opfsDir && dirName;
    if (!foundDir) return Promise.resolve();

    return opfsDir.removeEntry(dirName, { recursive: true })
      .then((_) => {
        console.warn(`the dir ${dirName} removed.`);
      });
  });

  it("writes and reads a file in OPFS", () => {
    const wk = new Worker(new URL("./opfs-worker.js", import.meta.url), {
      type: "module",
    });

    const { promise, resolve, reject } = Promise.withResolvers();

    const timer = setTimeout(
      () => reject(new Error("timeout")),
      1500,
    );

    wk.onmessage = (evt) => resolve(evt);

    wk.postMessage({
      dirName,
      payload: "test payload",
      fileName: "test-filename.dat",
    });

    return promise
      .then((evt) => {
        const { data } = evt;
        const {
          ok,
          msg,
        } = data;
        if (!ok) return Promise.reject(new Error(msg));

        console.warn("data from worker", data);

        return Promise.resolve();
      })
      .finally((_) => {
        clearTimeout(timer);
        wk.terminate();
        console.warn("worker terminated.");
      });
  });
});

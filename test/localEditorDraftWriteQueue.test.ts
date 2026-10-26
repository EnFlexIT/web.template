import {
  enqueueLocalEditorDraftOperation,
} from "@/template/editor/storage/localEditorDraftWriteQueue";

describe("localEditorDraftWriteQueue", () => {
  it("serializes operations for the same application", async () => {
    const order: string[] = [];

    let releaseFirst!: () => void;
    let signalFirstStarted!: () => void;

    const firstStarted = new Promise<void>(resolve => {
      signalFirstStarted = resolve;
    });

    const gate = new Promise<void>(resolve => {
      releaseFirst = resolve;
    });

    const first = enqueueLocalEditorDraftOperation(
      "test-app",
      "regular",
      async () => {
        order.push("first-start");
        signalFirstStarted();
        await gate;
        order.push("first-end");
      },
    );

    const second = enqueueLocalEditorDraftOperation(
      "test-app",
      "regular",
      async () => {
        order.push("second");
      },
    );

    await firstStarted;
    expect(order).toEqual(["first-start"]);

    releaseFirst();
    await Promise.all([first, second]);

    expect(order).toEqual([
      "first-start",
      "first-end",
      "second",
    ]);
  });

  it("continues after a failed operation", async () => {
    const first = enqueueLocalEditorDraftOperation(
      "failed-app",
      "regular",
      async () => {
        throw new Error("Testfehler");
      },
    );

    await expect(first).rejects.toThrow("Testfehler");

    const second = enqueueLocalEditorDraftOperation(
      "failed-app",
      "regular",
      async () => "success",
    );

    await expect(second).resolves.toBe("success");
  });

  it("keeps applications independent", async () => {
    let releaseFirst!: () => void;

    const gate = new Promise<void>(resolve => {
      releaseFirst = resolve;
    });

    const first = enqueueLocalEditorDraftOperation(
      "application-a",
      "regular",
      async () => {
        await gate;
      },
    );

    const second = enqueueLocalEditorDraftOperation(
      "application-b",
      "regular",
      async () => "independent",
    );

    await expect(second).resolves.toBe("independent");

    releaseFirst();
    await first;
  });
});
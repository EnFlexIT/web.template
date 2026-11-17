import {
  notifyLocalEditorDraftSaved,
  subscribeLocalEditorDraftSaved,
} from "../src/template/editor/storage/localEditorDraftEvents";

const savedEvent = {
  applicationId: "test-application",
  scope: "regular" as const,
};

describe("localEditorDraftEvents", () => {
  const unsubscribers: Array<() => void> = [];

  afterEach(() => {
    for (const unsubscribe of unsubscribers.splice(0)) {
      unsubscribe();
    }

    jest.clearAllMocks();
  });

  it("notifies a subscribed listener", () => {
    const listener = jest.fn();

    unsubscribers.push(
      subscribeLocalEditorDraftSaved(listener),
    );

    notifyLocalEditorDraftSaved(savedEvent);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(savedEvent);
  });

  it("stops notifications after unsubscribe", () => {
    const listener = jest.fn();

    const unsubscribe =
      subscribeLocalEditorDraftSaved(listener);

    unsubscribers.push(unsubscribe);

    unsubscribe();

    notifyLocalEditorDraftSaved(savedEvent);

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies multiple listeners", () => {
    const first = jest.fn();
    const second = jest.fn();

    unsubscribers.push(
      subscribeLocalEditorDraftSaved(first),
      subscribeLocalEditorDraftSaved(second),
    );

    notifyLocalEditorDraftSaved(savedEvent);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("continues when a listener throws", () => {
    const failingListener = jest.fn(() => {
      throw new Error("Listener failure");
    });

    const otherListener = jest.fn();

    unsubscribers.push(
      subscribeLocalEditorDraftSaved(failingListener),
      subscribeLocalEditorDraftSaved(otherListener),
    );

    expect(() =>
      notifyLocalEditorDraftSaved(savedEvent),
    ).not.toThrow();

    expect(failingListener).toHaveBeenCalledTimes(1);
    expect(otherListener).toHaveBeenCalledTimes(1);
  });
});
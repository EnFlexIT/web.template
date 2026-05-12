/// <reference types="jest" />

import reducer, {
  setExecSettingsField,
  addEmbeddedSystemAgent,
  removeEmbeddedSystemAgent,
  setEmbeddedSystemAgentField,
  clearExecSettingsError,
  resetExecSettings,
  fetchExecSettings,
  saveExecSettings,
  fetchProjects,
  fetchProjectSetups,
  fetchAvailableExecAgents,
} from "../redux/slices/execSettingsSlice";

describe("execSettingsSlice", () => {
  it("should return the initial state", () => {
    const state = reducer(undefined, { type: "unknown" });

    expect(state.settings.startAs).toBe("APPLICATION");
    expect(state.settings.serverMasterPort).toBe(1099);
    expect(state.settings.serverMasterPortMtp).toBe(7778);
    expect(state.settings.localMtpCreation).toBe("ConfiguredByJADE");
    expect(state.settings.bgSystemAutoInit).toBe(false);
    expect(state.settings.embeddedSystemAgents).toEqual([]);

    expect(state.appliedStartAs).toBe("APPLICATION");
    expect(state.projects).toEqual([]);
    expect(state.projectSetups).toEqual([]);
    expect(state.availableAgents).toEqual([]);
    expect(state.localIpSelections).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.isSaving).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should set exec settings field", () => {
    const state = reducer(
      undefined,
      setExecSettingsField({
        key: "startAs",
        value: "SERVER_MASTER",
      }),
    );

    expect(state.settings.startAs).toBe("SERVER_MASTER");
  });

  it("should set bgSystemAutoInit", () => {
    const state = reducer(
      undefined,
      setExecSettingsField({
        key: "bgSystemAutoInit",
        value: true,
      }),
    );

    expect(state.settings.bgSystemAutoInit).toBe(true);
  });

  it("should add embedded system agent", () => {
    const state = reducer(
      undefined,
      addEmbeddedSystemAgent({
        agentName: "Agent1",
        className: "com.test.Agent1",
      }),
    );

    expect(state.settings.embeddedSystemAgents).toHaveLength(1);
    expect(state.settings.embeddedSystemAgents[0]).toEqual({
      agentName: "Agent1",
      className: "com.test.Agent1",
    });
  });

  it("should remove embedded system agent", () => {
    let state = reducer(
      undefined,
      addEmbeddedSystemAgent({
        agentName: "Agent1",
        className: "com.test.Agent1",
      }),
    );

    state = reducer(state, removeEmbeddedSystemAgent(0));

    expect(state.settings.embeddedSystemAgents).toEqual([]);
  });

  it("should update embedded system agent field", () => {
    let state = reducer(
      undefined,
      addEmbeddedSystemAgent({
        agentName: "Agent1",
        className: "com.test.Agent1",
      }),
    );

    state = reducer(
      state,
      setEmbeddedSystemAgentField({
        index: 0,
        key: "agentName",
        value: "ChangedAgent",
      }),
    );

    expect(state.settings.embeddedSystemAgents[0].agentName).toBe("ChangedAgent");
  });

  it("should ignore embedded system agent field update for invalid index", () => {
    const state = reducer(
      undefined,
      setEmbeddedSystemAgentField({
        index: 99,
        key: "agentName",
        value: "Ignored",
      }),
    );

    expect(state.settings.embeddedSystemAgents).toEqual([]);
  });

  it("should handle fetchExecSettings.fulfilled", () => {
    const action = {
      type: fetchExecSettings.fulfilled.type,
      payload: {
        settings: {
          startAs: "SERVER_MASTER",
          serverMasterUrl: "127.0.0.1",
          serverMasterPort: 1099,
          serverMasterPortMtp: 7778,
          serverMasterProtocol: "HTTP",
          localMtpCreation: "ConfiguredByIPandPort",
          localMtpUrl: "localhost",
          localMtpPort: 7778,
          localMtpProtocol: "HTTP",
          embeddedSystemProject: "ProjectA",
          deviceSystemExecMode: "AGENT",
          serviceSetup: "SetupA",
          factoryId: "Factory1",
          bgSystemAutoInit: true,
          embeddedSystemAgents: [
            {
              agentName: "Agent1",
              className: "com.test.Agent1",
            },
          ],
        },
        localIpSelections: ["127.0.0.1", "192.168.0.10"],
      },
    };

    const state = reducer(undefined, action);

    expect(state.isLoading).toBe(false);
    expect(state.settings.startAs).toBe("SERVER_MASTER");
    expect(state.appliedStartAs).toBe("SERVER_MASTER");
    expect(state.localIpSelections).toEqual(["127.0.0.1", "192.168.0.10"]);
    expect(state.settings.embeddedSystemAgents).toHaveLength(1);
  });

  it("should handle saveExecSettings.fulfilled", () => {
    const payload = {
      startAs: "SERVER",
      serverMasterUrl: "server.local",
      serverMasterPort: 1099,
      serverMasterPortMtp: 7778,
      serverMasterProtocol: "HTTP",
      localMtpCreation: "ConfiguredByJADE",
      localMtpUrl: "",
      localMtpPort: 7778,
      localMtpProtocol: "HTTP",
      embeddedSystemProject: "",
      deviceSystemExecMode: "SETUP",
      serviceSetup: "",
      factoryId: "",
      bgSystemAutoInit: false,
      embeddedSystemAgents: [],
    };

    const state = reducer(undefined, {
      type: saveExecSettings.fulfilled.type,
      payload,
    });

    expect(state.isSaving).toBe(false);
    expect(state.settings.startAs).toBe("SERVER");
    expect(state.appliedStartAs).toBe("SERVER");
  });

  it("should handle fetchProjects.fulfilled", () => {
    const state = reducer(undefined, {
      type: fetchProjects.fulfilled.type,
      payload: ["ProjectA", "ProjectB"],
    });

    expect(state.projects).toEqual(["ProjectA", "ProjectB"]);
    expect(state.isLoading).toBe(false);
  });

  it("should handle fetchProjectSetups.fulfilled", () => {
    const state = reducer(undefined, {
      type: fetchProjectSetups.fulfilled.type,
      payload: ["SetupA", "SetupB"],
    });

    expect(state.projectSetups).toEqual(["SetupA", "SetupB"]);
    expect(state.isLoading).toBe(false);
  });

  it("should handle fetchAvailableExecAgents.fulfilled", () => {
    const state = reducer(undefined, {
      type: fetchAvailableExecAgents.fulfilled.type,
      payload: [{ className: "com.test.Agent1" }],
    });

    expect(state.availableAgents).toEqual([{ className: "com.test.Agent1" }]);
    expect(state.isLoading).toBe(false);
  });

  it("should clear error", () => {
    let state = reducer(undefined, {
      type: fetchProjects.rejected.type,
      error: { message: "Projects failed" },
    });

    expect(state.error).toBe("Projects failed");

    state = reducer(state, clearExecSettingsError());

    expect(state.error).toBeNull();
  });

  it("should reset exec settings", () => {
    let state = reducer(
      undefined,
      setExecSettingsField({
        key: "startAs",
        value: "SERVER_MASTER",
      }),
    );

    state = reducer(state, resetExecSettings());

    expect(state.settings.startAs).toBe("APPLICATION");
    expect(state.projects).toEqual([]);
    expect(state.projectSetups).toEqual([]);
    expect(state.availableAgents).toEqual([]);
    expect(state.localIpSelections).toEqual([]);
    expect(state.error).toBeNull();
  });
});
/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/execSettingsSlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux execSettingsSlice unabhängig von UI und Backend.
 *
 * Fokus:
 * - Initial State
 * - Reducer
 * - AsyncThunk fulfilled states
 * - Embedded System Agents
 * - Project / Setup Verwaltung
 * - Save / Fetch Verhalten
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - falsche EXEC.MODE Verarbeitung
 * - kaputte Reducer nach Refactoring
 * - fehlerhafte Embedded Agent Verwaltung
 * - verlorene Settings beim Save
 * - falsche appliedStartAs Werte
 * - fehlerhafte Project / Setup Verarbeitung
 * - inkonsistente Loading / Saving States
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Reducer Tests
 * 3. Embedded Agent Tests
 * 4. fulfilled AsyncThunk Tests
 * 5. Error Handling Tests
 * 6. Reset / Clear Tests
 *
 * ============================================================
 * BACKEND FEATURES COVERED
 * ============================================================
 * - EXEC.MODE
 * - PROJECTS
 * - PROJECT.SETUPS
 * - awb.agents
 * - saveExecSettings
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Slice isoliert testen ohne echte API oder React UI.
 * ============================================================
 */
/// <reference types="jest" />

import reducer, {
  setDerbyField,
  setGeneralConnectionField,
  setSelectedFactoryConnectionField,
  setSelectedFactoryId,
  clearDbSettingsError,
  fetchDbSettings,
  fetchDbSystemParameters,
  fetchGeneralDbConnectionSettings,
  fetchFactoryDbConnectionSettings,
  saveGeneralDbConnectionSettings,
  saveFactoryDbConnectionSettings,
  saveDerbyNetworkServerSettings,
  testGeneralDbConnection,
  testFactoryDbConnection,
} from "../src/redux/slices/dbSettingsSlice";

describe("dbSettingsSlice", () => {
  it("should return the initial state", () => {
    const state = reducer(undefined, { type: "unknown" });

    expect(state.dbSystems).toEqual([]);
    expect(state.dbSystemParameters).toEqual({});
    expect(state.factories).toEqual([]);
    expect(state.factoryStates).toEqual({});
    expect(state.selectedFactoryId).toBe("");

    expect(state.derbyNetworkServer).toEqual({
      isStartDerbyNetworkServer: false,
      hostIp: "localhost",
      port: 1527,
      userName: "",
      password: "",
    });

    expect(state.generalConnection.useForEveryFactory).toBe(false);
    expect(state.selectedFactoryConnection.factoryId).toBe("");
    expect(state.isLoading).toBe(false);
    expect(state.isSaving).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should set derby field", () => {
    const state = reducer(
      undefined,
      setDerbyField({
        key: "port",
        value: 1528,
      }),
    );

    expect(state.derbyNetworkServer.port).toBe(1528);
  });

  it("should set general connection field", () => {
    const state = reducer(
      undefined,
      setGeneralConnectionField({
        key: "dbSystem",
        value: "PostgreSQL",
      }),
    );

    expect(state.generalConnection.dbSystem).toBe("PostgreSQL");
  });

  it("should set selected factory connection field", () => {
    const state = reducer(
      undefined,
      setSelectedFactoryConnectionField({
        key: "url",
        value: "jdbc:test",
      }),
    );

    expect(state.selectedFactoryConnection.url).toBe("jdbc:test");
  });

  it("should set selected factory id and reset factory connection", () => {
    let state = reducer(
      undefined,
      setSelectedFactoryConnectionField({
        key: "url",
        value: "jdbc:old",
      }),
    );

    state = reducer(state, setSelectedFactoryId("FactoryA"));

    expect(state.selectedFactoryId).toBe("FactoryA");
    expect(state.selectedFactoryConnection.factoryId).toBe("FactoryA");
    expect(state.selectedFactoryConnection.url).toBe("");
  });

  it("should handle fetchDbSettings.fulfilled", () => {
    const state = reducer(undefined, {
      type: fetchDbSettings.fulfilled.type,
      payload: {
        dbSystems: ["Apache Derby", "PostgreSQL"],
        dbSystemParameters: {
          "Apache Derby": {
            name: "Apache Derby",
            driverClass: "org.apache.derby.iapi.jdbc.AutoloadedDriver",
            url: "jdbc:derby:test",
            urlMask: "jdbc:derby:{catalog}",
            defaultCatalog: "test",
            userName: "admin",
            password: "admin",
          },
        },
        factories: ["FactoryA", "FactoryB"],
        factoryStates: {
          FactoryA: "Created",
          FactoryB: "NotAvailableYet",
        },
        derbyNetworkServer: {
          isStartDerbyNetworkServer: true,
          hostIp: "localhost",
          port: 1527,
          userName: "admin",
          password: "admin",
        },
        generalConnection: {
          useForEveryFactory: true,
          dbSystem: "Apache Derby",
          driverClass: "org.apache.derby.iapi.jdbc.AutoloadedDriver",
          url: "jdbc:derby:test",
          defaultCatalog: "test",
          userName: "admin",
          password: "admin",
        },
        selectedFactoryId: "FactoryA",
      },
    });

    expect(state.isLoading).toBe(false);
    expect(state.dbSystems).toEqual(["Apache Derby", "PostgreSQL"]);
    expect(state.factories).toEqual(["FactoryA", "FactoryB"]);
    expect(state.factoryStates.FactoryA).toBe("Created");
    expect(state.generalConnection.useForEveryFactory).toBe(true);
    expect(state.selectedFactoryId).toBe("FactoryA");
    expect(state.selectedFactoryConnection.factoryId).toBe("FactoryA");
  });

  it("should handle fetchDbSystemParameters.fulfilled", () => {
    const state = reducer(undefined, {
      type: fetchDbSystemParameters.fulfilled.type,
      payload: {
        PostgreSQL: {
          name: "PostgreSQL",
          driverClass: "org.postgresql.Driver",
          url: "jdbc:postgresql://localhost:5432/test",
          urlMask: "jdbc:postgresql://{host}:{port}/{catalog}",
          defaultCatalog: "test",
          userName: "postgres",
          password: "postgres",
        },
      },
    });

    expect(state.isLoading).toBe(false);
    expect(state.dbSystemParameters.PostgreSQL.driverClass).toBe(
      "org.postgresql.Driver",
    );
  });

  it("should handle fetchGeneralDbConnectionSettings.fulfilled", () => {
    const payload = {
      useForEveryFactory: true,
      dbSystem: "PostgreSQL",
      driverClass: "org.postgresql.Driver",
      url: "jdbc:postgresql://localhost:5432/test",
      defaultCatalog: "test",
      userName: "postgres",
      password: "postgres",
    };

    const state = reducer(undefined, {
      type: fetchGeneralDbConnectionSettings.fulfilled.type,
      payload,
    });

    expect(state.isLoading).toBe(false);
    expect(state.generalConnection).toEqual(payload);
  });

  it("should handle saveGeneralDbConnectionSettings.fulfilled", () => {
    const payload = {
      useForEveryFactory: true,
      dbSystem: "Apache Derby",
      driverClass: "org.apache.derby.iapi.jdbc.AutoloadedDriver",
      url: "jdbc:derby:test",
      defaultCatalog: "test",
      userName: "admin",
      password: "admin",
    };

    const state = reducer(undefined, {
      type: saveGeneralDbConnectionSettings.fulfilled.type,
      payload,
    });

    expect(state.isSaving).toBe(false);
    expect(state.generalConnection).toEqual(payload);
  });

  it("should handle fetchFactoryDbConnectionSettings.fulfilled", () => {
    const payload = {
      factoryId: "FactoryA",
      dbSystem: "PostgreSQL",
      driverClass: "org.postgresql.Driver",
      url: "jdbc:postgresql://localhost:5432/factory",
      defaultCatalog: "factory",
      userName: "postgres",
      password: "postgres",
    };

    const state = reducer(undefined, {
      type: fetchFactoryDbConnectionSettings.fulfilled.type,
      payload,
    });

    expect(state.isLoading).toBe(false);
    expect(state.selectedFactoryId).toBe("FactoryA");
    expect(state.selectedFactoryConnection).toEqual(payload);
  });

  it("should handle saveFactoryDbConnectionSettings.fulfilled", () => {
    const payload = {
      factoryId: "FactoryB",
      dbSystem: "Apache Derby",
      driverClass: "org.apache.derby.iapi.jdbc.AutoloadedDriver",
      url: "jdbc:derby:factoryB",
      defaultCatalog: "factoryB",
      userName: "admin",
      password: "admin",
    };

    const state = reducer(undefined, {
      type: saveFactoryDbConnectionSettings.fulfilled.type,
      payload,
    });

    expect(state.isSaving).toBe(false);
    expect(state.selectedFactoryId).toBe("FactoryB");
    expect(state.selectedFactoryConnection).toEqual(payload);
  });

  it("should handle saveDerbyNetworkServerSettings.fulfilled", () => {
    const payload = {
      isStartDerbyNetworkServer: true,
      hostIp: "127.0.0.1",
      port: 1528,
      userName: "admin",
      password: "admin",
    };

    const state = reducer(undefined, {
      type: saveDerbyNetworkServerSettings.fulfilled.type,
      payload,
    });

    expect(state.isSaving).toBe(false);
    expect(state.derbyNetworkServer).toEqual(payload);
  });

  it("should handle testGeneralDbConnection.fulfilled", () => {
    const state = reducer(undefined, {
      type: testGeneralDbConnection.fulfilled.type,
      payload: "Connection test was successful.",
    });

    expect(state.isSaving).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should handle testFactoryDbConnection.fulfilled", () => {
    const state = reducer(undefined, {
      type: testFactoryDbConnection.fulfilled.type,
      payload: "Connection test was successful.",
    });

    expect(state.isSaving).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should clear error", () => {
    let state = reducer(undefined, {
      type: fetchDbSettings.rejected.type,
      error: { message: "DB failed" },
    });

    expect(state.error).toBe("DB failed");

    state = reducer(state, clearDbSettingsError());

    expect(state.error).toBeNull();
  });
});
/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/dbSettingsSlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux dbSettingsSlice isoliert ohne echte API
 * und ohne React UI.
 *
 * Fokus:
 * - DB Settings State
 * - Derby Network Server Settings
 * - General DB Connection Settings
 * - Factory DB Connection Settings
 * - Reducer
 * - fulfilled AsyncThunk States
 * - Error Handling
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - verlorene DB-Verbindungen
 * - falsche Factory-Zuordnung
 * - kaputte Derby-Konfiguration
 * - fehlerhafte Reducer
 * - falsche selectedFactoryId
 * - fehlerhafte Save/Fetch Zustände
 * - inkonsistente DB-Systeme
 * - kaputte Loading/Saving States
 *
 * ============================================================
 * TEST CATEGORIES
 * ============================================================
 * 1. Initial State Tests
 * 2. Reducer Tests
 * 3. Derby Settings Tests
 * 4. General Connection Tests
 * 5. Factory Connection Tests
 * 6. fulfilled AsyncThunk Tests
 * 7. Error Handling Tests
 *
 * ============================================================
 * BACKEND FEATURES COVERED
 * ============================================================
 * - DB.SYSTEMS
 * - DB.SYSTEMS.PARAMETER
 * - DB.FACTORIES
 * - DB.CONN.GENERAL
 * - DB.CONN.FACTORY.GET
 * - db.conn.factory.set
 * - db.conn.general
 * - db.conn.test
 * - DB.DERBY.NETWORKSERVER
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Sichere Prüfung der gesamten DB-Settings-Logik,
 * damit Refactoring und Backend-Änderungen keine
 * versteckten Fehler erzeugen.
 * ============================================================
 */
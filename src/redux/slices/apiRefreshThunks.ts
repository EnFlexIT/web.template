import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../store";
import { setJwtLocal } from "./apiSlice";
import { getJwtRemainingMs } from "../../util/jwtTime";
import { extractJwtFromWwwAuthenticate } from "../../util/jwtHeader";

const jwtKey = "jwt";

let lastRenewAttempt = 0;

export const renewJwtIfNeeded = createAsyncThunk<
  void,
  { thresholdMs?: number; cooldownMs?: number }
>(
  "api/renewJwtIfNeeded",
  async (
    { thresholdMs = 2 * 60 * 1000, cooldownMs = 15_000 } = {},
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const { jwt, awb_rest_api } = state.api;

    if (!jwt) return;

    const remaining = getJwtRemainingMs(jwt);

    // Noch genug Zeit → nichts tun
    if (remaining > thresholdMs) return;

    const now = Date.now();

    // Cooldown Schutz
    if (now - lastRenewAttempt < cooldownMs) return;
    lastRenewAttempt = now;

    try {
   
      const response = await awb_rest_api.adminsApi.infoGet();
    

      const newJwt = extractJwtFromWwwAuthenticate(response.headers);

      if (!newJwt) return;

      thunkAPI.dispatch(setJwtLocal(newJwt));
      await AsyncStorage.setItem(jwtKey, newJwt);

      console.log("JWT renewed successfully ");
    } catch (e) {
      console.warn("JWT renew failed", e);
    }
  }
);

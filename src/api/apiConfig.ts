// src/api/apiConfig.ts
import { Configuration } from "./implementation/Dynamic-Content-Api";

export const apiConfig = new Configuration({
  basePath: "http://localhost:8080/api",
  accessToken: () => localStorage.getItem("token") ?? "",
});
// src/config/DatabaseConnectionSettings.ts
import { PropertyEntry } from "../../api/implementation/AWB-RestAPI/index";


export class DatabaseConnectionSettings {
  host = "";
  port = 0;

  static fromPropertyEntries(entries: PropertyEntry[]) {
    const settings = new DatabaseConnectionSettings();

    entries.forEach(e => {
      switch (e.key) {
        case "db.host":
          settings.host = e.value;
          break;
        case "db.port":
          settings.port = Number(e.value);
          break;
      }
    });

    return settings;
  }

  toPropertyEntries(): PropertyEntry[] {
    return [
      { key: "db.host", value: this.host, valueType: "STRING" },
      { key: "db.port", value: String(this.port), valueType: "INTEGER" },
    ];
  }
}
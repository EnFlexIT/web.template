import { useEffect } from "react";
import { loadDbSettings } from "../api/services/settings.service";

export default function SettingsTest() {
  useEffect(() => {
    loadDbSettings()
      .then(data => {
        console.log("DB Settings:", data);
      })
      .catch(err => {
        console.error("Fehler beim Laden der DB Settings:", err);
      });
  }, []);

  return <div>Settings Test – siehe Console</div>;
}

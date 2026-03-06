import React from "react";
import ReactDOM from "react-dom/client";
import '@fontsource-variable/inter';
import App from "./App";
import './i18n/i18n'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

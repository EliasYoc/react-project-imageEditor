import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import ToolBoxesProvider from "./context/ToolBoxesProvider";
import ConfigurationProvider from "./context/ConfigurationProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ToolBoxesProvider>
      <ConfigurationProvider>
        <App />
      </ConfigurationProvider>
    </ToolBoxesProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

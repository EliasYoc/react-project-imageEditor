import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ToolBoxesProvider from "./context/ToolBoxesProvider";
import ConfigurationProvider from "./context/ConfigurationProvider";
import { Provider } from "react-redux";
import { store } from "./app/store";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ToolBoxesProvider>
      <ConfigurationProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </ConfigurationProvider>
    </ToolBoxesProvider>
  </React.StrictMode>
);

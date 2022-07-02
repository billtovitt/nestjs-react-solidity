import React from "react";
import ReactDOM from "react-dom/client";

import { StrictMode } from "react";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import App from "./App";
import "./index.css";

const getLibrary = (provider) => {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 8000; // frequency provider is polling
  return library;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
      <ToastContainer />
    </Web3ReactProvider>
  </StrictMode>
);

import "react-app-polyfill/stable";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

const transcriber = document.createElement("div");
transcriber.id = "transcriber";
document.body.appendChild(transcriber);
ReactDOM.render(<App iiifBaseUrl="https://iiif.archivelab.org/iiif" {...window.transcriberData} />, transcriber);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

import "react-app-polyfill/stable";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

const transcriber = document.createElement("div");
document.body.appendChild(transcriber);
ReactDOM.render(<App {...window.transcriberData} />, transcriber);

if (window.mw && window.mw.config.get("wgMFMode")) {
  let transcriberEdit = null;

  window.mw.hook("mobileFrontend.editorOpened").add(() => {
    transcriber.style.display = "none";

    if (!transcriberEdit) {
      transcriberEdit = document.createElement("div");
      document.body.appendChild(transcriberEdit);
    }

    const textbox = document.getElementById("wikitext-editor");
    if (!textbox) return;
    const matches = textbox.value.match(/\bTitle=(\S+)/);
    if (!matches) return;
    const leaf = matches[1];
    const imageData = window.transcriberData.imageData[leaf];

    ReactDOM.render(<App
      mode="edit"
      mobileFrontend={true}
      archiveItem={{id: window.transcriberData.archiveItem.id, leaf}}
      imageUrl={imageData.url}
      iiifDimensions={{width: imageData.w, height: imageData.h}}
      mediawikiApi={window.transcriberData.mediawikiApi}
    />, transcriberEdit);
  });

  window.mw.hook("mobileFrontend.editorClosed").add(() => {
    if (transcriberEdit) {
      ReactDOM.unmountComponentAtNode(transcriberEdit);
    }

    transcriber.style.display = "block";
  });

  window.mw.trackSubscribe("mf.schemaEditAttemptStep", (topic, data) => {
    if (data && data.action && data.action === "saveIntent" && transcriberEdit) {
      transcriberEdit.style.display = "none";
    }
  });
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

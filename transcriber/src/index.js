import "react-app-polyfill/stable";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import styles from "./App.module.scss";
import * as serviceWorker from "./serviceWorker";

const mobileFrontend = !!(window.mw && window.mw.config.get("wgMFMode"));
const transcriber = document.createElement("div");
document.body.appendChild(transcriber);
ReactDOM.render(<App {...window.transcriberData} mobileFrontend={mobileFrontend} />, transcriber);

if (mobileFrontend) {
  let transcriberEdit, observer;

  window.mw.hook("mobileFrontend.editorOpened").add(() => {
    transcriber.classList.add(styles.closed);

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
      mobileFrontend={mobileFrontend}
      archiveItem={{id: window.transcriberData.archiveItem.id, leaf}}
      imageUrl={imageData.url}
      iiifDimensions={{width: imageData.w, height: imageData.h}}
      mediawikiApi={window.transcriberData.mediawikiApi}
    />, transcriberEdit);

    const header = document.querySelector(".editor-overlay .initial-header");
    if (header) {
      observer = new MutationObserver(() => {
        if (header.classList.contains("hidden")) {
          transcriberEdit.classList.add(styles.closed);
        } else {
          transcriberEdit.classList.remove(styles.closed);
        }
      });

      observer.observe(header, { attributes: true, attributeFilter: ["class"] });
    }

  });

  window.mw.hook("mobileFrontend.editorClosed").add(() => {
    if (transcriberEdit) {
      ReactDOM.unmountComponentAtNode(transcriberEdit);
    }
    if (observer) {
      observer.disconnect();
    }
    transcriber.classList.remove(styles.closed);
  });
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

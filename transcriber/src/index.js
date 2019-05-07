import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';

let transcriber = document.createElement("div");
transcriber.id = "transcriber";
document.body.appendChild(transcriber);
ReactDOM.render(<App />, document.getElementById('transcriber'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

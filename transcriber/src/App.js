import React, { Component } from 'react';
import PinchZoomPan from "react-responsive-pinch-zoom-pan";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faKeyboard } from '@fortawesome/free-solid-svg-icons';

import './App.css';

import Keyboard from './Keyboard';

let entryImageUrl = window.entryImageUrl;

let iiifBaseUrl = 'https://iiif.archivelab.org/iiif/';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.caretRef = React.createRef();
    this.textbox = document.getElementById("wpTextbox1");
    this.state = {
      preText: "",
      postText: "",
      open: true,
    };
  }

  handleCaretMove = () => {
    let sel = window.getSelection();
    if (!sel.isCollapsed) {
      return;
    }

    let node = sel.anchorNode;
    let offset = sel.anchorOffset;
    while (node.previousSibling) {
      node = node.previousSibling;
      if (node.nodeType === 3) {
        offset += node.nodeValue.length;
      }
    }

    let text = this.state.preText + this.state.postText;
    this.setState({
      preText: text.slice(0, offset),
      postText: text.slice(offset),
    })
  }

  scrollToCaret = () => {
    let caret = this.caretRef.current;
    caret.scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" })
  }

  bufferChange = buffer => {
    this.setState({
      preText: buffer
    }, this.scrollToCaret);
  }

  imageChange = state => {
    this.imageState = state;
  }

  getIiifIdentifier = () => {
    let textbox = document.getElementById("wpTextbox1");

    let matches = textbox.value.match(/\bEntryID=(\S+).*\bTitle=(\S+)/s);
    return matches
      ? `${matches[1]}%24${matches[2]}`
      : null;
  }

  getImageRegionUrl = () => {
    if (!this.imageState) return null;

    let id = this.getIiifIdentifier();
    if (!id) return null;

    let { left, top, scale, containerDimensions, imageDimensions } = this.imageState;
    let xPct = (-100 * left / (imageDimensions.width * scale)).toFixed(2);
    let yPct = (-100 * top / (imageDimensions.height * scale)).toFixed(2);
    let widthPct = (100 * containerDimensions.width / (imageDimensions.width * scale)).toFixed(2);
    let heightPct = (100 * containerDimensions.height / (imageDimensions.height * scale)).toFixed(2);

    return `${iiifBaseUrl}${id}/pct:${xPct},${yPct},${widthPct},${heightPct}/full/0/default.jpg`;
  }

  getTranscription = () => {
    let matches = this.textbox.value.match(/(?:.*<transcription>)(.*?)(?:<\/transcription>.*)/s);
    if (matches) {
      this.setState({ preText: matches[1].trim(), postText: "" }, this.scrollToCaret);
    }
  }

  setTranscription = () => {
    let transcription = (this.state.preText + this.state.postText).trim();
    let matches = this.textbox.value.match(/(.*<transcription>).*(<\/transcription>.*)/s);
    if (matches) {
      this.textbox.value = [matches[1], transcription, matches[2]].join("\n");
    } else {
      this.textbox.value = this.textbox.value + "<transcription>" + transcription + "</transcription>";
    }
  }

  handleOpenClose = () => {
    if (this.state.open) {
      this.setState({ open: false }, this.setTranscription);
    } else {
      this.setState({ open: true }, this.getTranscription);
    }
  }

  render() {
    return (
      <div className="App">
        <div className={"transcriber " + (!this.state.open ? "closed" : "")}>
          <meta name="viewport" content={"width=device-width, user-scalable=" + (this.state.open ? "no" : "yes")} />
          <div id="image-container" className="image-container">
            <PinchZoomPan maxScale={5} doubleTapBehavior="zoom" onChange={this.imageChange}>
              <img id="lontar" alt="lontar" src={entryImageUrl} />
            </PinchZoomPan>
          </div>
          <div className="text" onClick={this.handleCaretMove}>
            {this.state.preText}
            <span id="caret" ref={this.caretRef}></span>
            {this.state.postText}
          </div>
          <Keyboard
            script="bali"
            onBufferChange={this.bufferChange}
            buffer={this.state.preText}
          />
        </div>
        <button
          className={"close-button" + (this.state.open ? "" : " closed")}
          onClick={this.handleOpenClose}
        >
          <FontAwesomeIcon icon={this.state.open ? faTimes : faKeyboard} />
        </button>
      </div>
    );
  }
}

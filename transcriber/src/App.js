import React, { Component } from 'react';
import PinchZoomPan from "react-responsive-pinch-zoom-pan";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faKeyboard } from '@fortawesome/free-solid-svg-icons';

import './App.css';

import Keyboard from './Keyboard';

let entryImageUrl = window.entryImageUrl;

let iiifBaseUrl = 'https://iiif.archivelab.org/iiif/';

const blockPinchZoom = e => {
  e.preventDefault();
}

const blockTapZoom = e => {
  e.preventDefault();
  e.target.click();
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.caretRef = React.createRef();
    this.textbox = document.getElementById("wpTextbox1");
    this.isSafari = navigator.userAgent.includes("Safari");
    this.state = {
      preText: "",
      postText: "",
      open: true,
      error: false,
    };
  }

  componentDidMount = () => {
    this.checkTags();
    this.getTranscription();
  }

  checkTags = () => {
    let error = false;
    let openTags = this.textbox.value.match(/<transcription>/g);
    let closeTags = this.textbox.value.match(/<\/transcription>/g);
    if (!openTags || !closeTags || (openTags && openTags.length !== 1) || (closeTags && closeTags.length !== 1)) {
      error = true;
    }
    if (error) {
      alert("Transcription tags are malformed!");
    }
    this.setState({ error });
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
      this.textbox.value += "\n<transcription>\n" + transcription + "\n</transcription>";
    }
  }

  handleOpen = () => {
    this.checkTags();
    if (this.isSafari) {
      document.addEventListener('touchmove', blockPinchZoom, { passive: false });
      document.addEventListener('touchend', blockTapZoom, { passive: false });
    }
    this.setState({ open: true }, this.getTranscription);
  }

  handleClose = () => {
    if (this.isSafari) {
      document.removeEventListener('touchmove', blockPinchZoom);
      document.removeEventListener('touchend', blockTapZoom);
    }
    this.setState({ open: false }, this.setTranscription);
  }

  render() {
    return (
      <div className="App">
        <div className={"transcriber " + (this.state.open && !this.state.error ? "" : "closed")}>
          <meta name="viewport" content={"width=device-width, user-scalable=" + (this.state.open ? "no" : "yes")} />
          <div id="image-container" className="image-container">
            <PinchZoomPan maxScale={5} doubleTapBehavior="zoom" onChange={this.imageChange}>
              <img id="lontar" alt="lontar" src={entryImageUrl} />
            </PinchZoomPan>
          </div>
          <div className="tr-text" onClick={this.handleCaretMove}>
            {this.state.preText}
            <span id="tr-caret" ref={this.caretRef}></span>
            {this.state.postText}
          </div>
          <Keyboard
            script="bali"
            onBufferChange={this.bufferChange}
            buffer={this.state.preText}
          />
        </div>
        {this.state.open && !this.state.error ?
          <button
            className={"tr-close-button"}
            onClick={this.handleClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          :
          <button
            className={"tr-open-button"}
            onClick={this.handleOpen}
          >
            <FontAwesomeIcon icon={faKeyboard} />
          </button>
        }
      </div>
      );
    }
  }

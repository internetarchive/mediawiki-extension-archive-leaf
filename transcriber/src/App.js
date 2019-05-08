import React, { Component } from 'react';
import PinchZoomPan from "react-responsive-pinch-zoom-pan";
import './App.css';

import Keyboard from './Keyboard';

let entryImageUrl = window.entryImageUrl;

let iiifBaseUrl = 'https://iiif.archivelab.org/iiif/';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.textRef = React.createRef();
    this.caretRef = React.createRef();
    this.state = {
      preText: "",
      postText: "",
      caretPosition: 0,
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

  scrollTextDown = () => {
    let caret = this.caretRef.current;
    caret.scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" })
  }

  bufferChange = buffer => {
    this.setState({
      preText: buffer
    }, this.scrollTextDown);
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

  render() {
    return (
      <div className="App">
        {this.state.open &&
          <div className="transcriber">
            <meta name="viewport" content="width=device-width, user-scalable=no" />
            <div id="image-container" className="image-container">
              <PinchZoomPan maxScale={5} doubleTapBehavior="zoom" onchange={this.imageChange}>
                <img id="lontar" alt="lontar" src={entryImageUrl} />
              </PinchZoomPan>
            </div>
            <div className="text" onClick={this.handleCaretMove} ref={this.textRef}>
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
        }
        <button
          className={"close-button" + (this.state.open ? "" : " closed")}
          onClick={() => this.setState({ open: !this.state.open })}
        >
          {this.state.open ? "×" : "⌨"}
        </button>
      </div>
    );
  }
}

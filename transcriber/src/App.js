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

  getRegionUrl = () => {
    let url = iiifBaseUrl;
    let textbox = document.getElementById("wpTextbox1");

    let matches = textbox.value.match(/EntryID=(.+)/);
    if (!matches) return null;
    url += matches[1];

    matches = textbox.value.match(/Title=(.+)/);
    if (!matches) return null;
    url += `%24${matches[1]}/`;

    // TODO: do this properly through React
    matches = img.getAttribute('style').match(/translate3d\(-([0-9.]+)px, -([0-9.]+)px, 0px\) scale\(([0-9.]+)\)/);
    if (!matches) return null;
    let xOffset = matches[1];
    let yOffset = matches[2];
    let scale = matches[3];

    let containerRect = document.getElementById("image-container").getBoundingClientRect();
    let img = document.getElementById("lontar");

    let xPct = (100 * xOffset / (img.width * scale)).toFixed(2);
    let yPct = (100 * yOffset / (img.height * scale)).toFixed(2);
    let widthPct = (100 * containerRect.width / (img.width * scale)).toFixed(2);
    let heightPct = (100 * containerRect.height / (img.height * scale)).toFixed(2);

    url += `pct:${xPct},${yPct},${widthPct},${heightPct}/full/0/default.jpg`;
    return url;
  }

  render() {
    return (
      <div className="App">
        {this.state.open &&
          <div className="transcriber">
            <meta name="viewport" content="width=device-width, user-scalable=no" />
            <div id="image-container" className="image-container">
              <PinchZoomPan maxScale={5} doubleTapBehavior="zoom">
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

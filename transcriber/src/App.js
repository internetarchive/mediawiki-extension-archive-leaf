import React, { Component } from 'react';
import PinchZoomPan from "react-responsive-pinch-zoom-pan";
import './App.css';

import Keyboard from './Keyboard';

// window.entryImageUrl = "https://archive.org/download/tutur-smara-bhuwana/page/leaf1.jpg";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.textRef = React.createRef();
    this.caretRef = React.createRef();
    this.state = {
      preText: "",
      postText: "",
      caretPosition: 0,
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
    caret.scrollIntoView({block: "start", inline: "nearest", behavior: "smooth"})
  }

  bufferChange = buffer => {
    this.setState({
      preText: buffer
    }, this.scrollTextDown);
  }

  render() {
    return (
      <div className="App">
        <meta name="viewport" content="width=device-width, user-scalable=no" />
        <div className="image-container">
          <PinchZoomPan maxScale={5} doubleTapBehavior="zoom">
            <img alt="lontar" src={window.entryImageUrl} />
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
    );
  }
}

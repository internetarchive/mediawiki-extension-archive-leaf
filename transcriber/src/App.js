import React, { Component } from 'react';
import PinchZoomPan from "react-responsive-pinch-zoom-pan";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faKeyboard } from '@fortawesome/free-solid-svg-icons';

import './App.css';

import Keyboard from './Keyboard';

let entryImageUrl = window.entryImageUrl;
let iiifBaseUrl = 'https://iiif.archivelab.org/iiif/';

{
  let vh = document.documentElement.clientHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  window.addEventListener('resize', () => {
    let vh = document.documentElement.clientHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  });
}

const blockPinchZoom = e => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
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
    this.isSafari = navigator.userAgent.includes("Safari") && navigator.userAgent.includes("Mobile") && !navigator.userAgent.includes("Chrome");
    this.state = {
      text: "",
      caretPos: 0,
      open: true,
      error: false,
    };
  }

  componentDidMount = () => {
    this.checkTags();
    this.afterOpen();
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
    if (!sel.anchorNode || !sel.isCollapsed) {
      return;
    }

    let node = sel.anchorNode;
    let caretPos = sel.anchorOffset;
    while (node.previousSibling) {
      node = node.previousSibling;
      if (node.nodeType === 3) {
        caretPos += node.nodeValue.length;
      }
    }
    this.setState({caretPos});
  }

  scrollToCaret = () => {
    let caret = this.caretRef.current;
    caret.offsetParent.scrollTop = caret.offsetTop;
    //caret.scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });
  }

  textChange = (text, caretPos) => {
    this.setState({
      text,
      caretPos
    }, this.scrollToCaret);
  }

  getTranscription = () => {
    let matches = this.textbox.value.match(/(?:.*<transcription>)(.*?)(?:<\/transcription>.*)/s);
    if (matches) {
      let text = matches[1].trim();
      this.setState({ text, caretPos: text.length }, this.scrollToCaret);
    }
  }

  setTranscription = () => {
    let transcription = (this.state.text).trim();
    let matches = this.textbox.value.match(/(.*<transcription>).*(<\/transcription>.*)/s);
    if (matches) {
      this.textbox.value = [matches[1], transcription, matches[2]].join("\n");
    } else {
      this.textbox.value += "\n<transcription>\n" + transcription + "\n</transcription>";
    }
  }

  handleOpen = () => {
    this.checkTags();
    this.setState({ open: true }, this.afterOpen);
  }

  afterOpen = () => {
    if (!this.error) {
      if (this.isSafari) {
        document.addEventListener('touchmove', blockPinchZoom, { passive: false });
        document.addEventListener('touchend', blockTapZoom, { passive: false });
      }
      document.body.classList.add('noscroll');
      this.getTranscription();
    }
  }

  handleClose = () => {
    if (this.isSafari) {
      document.removeEventListener('touchmove', blockPinchZoom);
      document.removeEventListener('touchend', blockTapZoom);
    }
    document.body.classList.remove('noscroll');
    this.setState({ open: false }, this.setTranscription);
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
        <div className="transcriber">
          <div className={"image-container " + (this.state.open && !this.state.error ? "" : "closed")}>
            <PinchZoomPan maxScale={5} doubleTapBehavior="zoom" onChange={this.imageChange}>
              <img id="lontar" alt="lontar" src={entryImageUrl} />
            </PinchZoomPan>
          </div>
          {(this.state.open && !this.state.error) &&
            <>
              <div className="tr-text" onClick={this.handleCaretMove}>
                {this.state.text.slice(0, this.state.caretPos)}
                <span className="tr-caret" ref={this.caretRef}></span>
                {this.state.text.slice(this.state.caretPos)}
              </div>
              <Keyboard
                script="bali"
                onTextChange={this.textChange}
                text={this.state.text}
                caretPos={this.state.caretPos}
              />
            </>
          }
        </div>
        {(this.state.open && !this.state.error) ?
          <button
            className={"tr-close-button"}
            onClick={this.handleClose}
          >
            <meta name="viewport" content="width=device-width, user-scalable=no" />
            <FontAwesomeIcon icon={faTimes} />
          </button>
          :
          <button
            className={"tr-open-button"}
            onClick={this.handleOpen}
          >
            <meta name="viewport" content="width=device-width, user-scalable=yes" />
            <FontAwesomeIcon icon={faKeyboard} />
          </button>
        }
      </div>
    );
  }
}

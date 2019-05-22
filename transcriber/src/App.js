import 'react-app-polyfill/stable';
import React, { Component } from 'react';
import PinchZoomPan from 'react-responsive-pinch-zoom-pan';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faKeyboard } from '@fortawesome/free-solid-svg-icons';

import './App.css';

import Keyboard from './Keyboard';

let entryImageUrl = window.entryImageUrl;
let iiifBaseUrl = 'https://iiif.archivelab.org/iiif';

const blockPinchZoom = e => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}

// const blockTapZoom = e => {
//   e.preventDefault();
//   e.target.click();
// }

const getCaretViaGetSelection = () => {
  if (window.getSelection) {
      let sel = window.getSelection();
      if (!sel.anchorNode || !sel.isCollapsed) {
        return null;
      }
      return { node: sel.anchorNode, caretPos: sel.anchorOffset };
  } else {
    return null;
  }
}

const getCaretViaCaretRangeFromPoint = e => {
  if (document.caretRangeFromPoint) {
    let range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range || !range.collapsed) {
      return null;
    }
    return { node: range.commonAncestorContainer, caretPos: range.startOffset };
  } else {
    return null;
  }
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.caretRef = React.createRef();
    this.textbox = document.getElementById("wpTextbox1");

    this.detectPlatform();
    this.viewportFix();

    this.state = {
      text: "",
      caretPos: 0,
      open: true,
      error: false,
    };
  }

  detectPlatform = () => {
    let ua = window.navigator.userAgent;
    this.isIOS = ua.match(/iPhone|iPod|iPad/);
    this.isIOSSafari = this.isIOS && ua.match(/WebKit/) && !ua.match(/CriOS/);
    this.isMobile = this.isIOS || ua.match(/Android/);
  }

  viewportFix = () => {
    if (this.isMobile) {
      document.documentElement.style.setProperty('--vh', this.getVhPx());
      window.addEventListener('resize', () => {
        document.documentElement.style.setProperty('--vh', this.getVhPx());
      });
    }
  }

  getVhPx = () => {
    let height = document.documentElement.clientHeight;
    return (height * 0.01) + 'px';
  }

  componentDidMount = () => {
    this.checkTags();
    this.afterOpen();
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.state.caretPos !== prevState.caretPos || this.state.text !== prevState.text) {
      this.scrollToCaret();
    }
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

  handleCaretMove = e => {
    let sel = this.isIOS
      ? getCaretViaCaretRangeFromPoint(e)
      : getCaretViaGetSelection();

    if (sel) {
      let { node, caretPos } = sel;

      while (node.previousSibling) {
        node = node.previousSibling;
        if (node.nodeType === 3) {
          caretPos += node.nodeValue.length;
        }
      }
      this.setState({ caretPos });
    }
  }

  scrollToCaret = () => {
    let caret = this.caretRef.current;
    caret.offsetParent.scrollTop = caret.offsetTop;
  }

  textChange = (text, caretPos) => {
    this.setState({ text, caretPos });

    let key = this.storageKey();
    if (key) {
      window.localStorage.setItem(key, text);
    }
  }

  getArchiveItem = () => {
    let matches = this.textbox.value.match(/\bEntryID=(\S+).*\bTitle=(\S+)/s);
    if (matches) {
      this.archiveItem = { id: matches[1], leaf: matches[2] };
    } else {
      this.archiveItem = null;
    }
  }

  storageKey = () => {
    if (this.archiveItem) {
      return this.archiveItem.id + '$' + this.archiveItem.leaf;
    } else {
      return null;
    }
  }

  getTranscription = () => {
    let matches = this.textbox.value.match(/(?:.*<transcription>)(.*?)(?:<\/transcription>.*)/s);
    if (matches) {
      let text = matches[1].trim();
      this.setState({ text, caretPos: text.length });
      setTimeout(() => this.checkStoredText(text), 1000);
    }
  }

  checkStoredText = text => {
    let key = this.storageKey();
    if (key) {
      let savedText = window.localStorage.getItem(key);
      if (savedText) {
        savedText = savedText.trim();
        if (savedText !== text) {
          let useSaved = window.confirm("It looks like your work was interrupted. Do you want to restore your previous work?");
          if (useSaved) {
            this.setState({ text: savedText, caretPos: savedText.length });
          }
        }
        window.localStorage.removeItem(key);
      }
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

    let key = this.storageKey();
    if (key) {
      window.localStorage.removeItem(key);
    }
  }

  handleOpen = () => {
    this.checkTags();
    this.setState({ open: true }, this.afterOpen);
  }

  afterOpen = () => {
    if (!this.error) {
      if (this.isIOSSafari) {
        document.addEventListener('touchmove', blockPinchZoom, { passive: false });
        //document.addEventListener('touchend', blockTapZoom, { passive: false });
      }
      document.body.classList.add('noscroll');
      document.addEventListener('keydown', this.handleKeydown);

      this.getArchiveItem();
      this.getTranscription();
    }
  }

  handleClose = () => {
    if (this.isIOSSafari) {
      document.removeEventListener('touchmove', blockPinchZoom);
      //document.removeEventListener('touchend', blockTapZoom);
    }
    document.body.classList.remove('noscroll');
    document.removeEventListener('keydown', this.handleKeydown);
    this.setState({ open: false }, this.setTranscription);
  }

  handleKeydown = e => {
    if (e.key === "Escape" && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
      this.handleClose();
      e.preventDefault();
    }
  }

  imageChange = state => {
    this.imageState = state;
  }

  getImageRegionUrl = () => {
    if (!(this.imageState && this.archiveItem)) return null;

    let { left, top, scale, containerDimensions, imageDimensions } = this.imageState;
    let xPct = (-100 * left / (imageDimensions.width * scale)).toFixed(2);
    let yPct = (-100 * top / (imageDimensions.height * scale)).toFixed(2);
    let widthPct = (100 * containerDimensions.width / (imageDimensions.width * scale)).toFixed(2);
    let heightPct = (100 * containerDimensions.height / (imageDimensions.height * scale)).toFixed(2);

    return `${iiifBaseUrl}/${this.archiveItem.id}%24${this.archiveItem.leaf}/pct:${xPct},${yPct},${widthPct},${heightPct}/full/0/default.jpg`;
  }

  render() {
    return (
      <div className="App">
        <div className={"transcriber " + (this.state.open && !this.state.error ? "" : "closed")}>
          <div className="image-container">
            <PinchZoomPan maxScale={5} doubleTapBehavior="zoom" zoomButtons={!this.isMobile} onChange={this.imageChange}>
              <img id="lontar" alt="lontar" src={entryImageUrl} />
            </PinchZoomPan>
          </div>
          <div className="tr-text" onClick={this.handleCaretMove}>
            {this.state.text.slice(0, this.state.caretPos)}
            <span className="tr-caret" ref={this.caretRef}></span>
            {this.state.text.slice(this.state.caretPos)}
          </div>
          {(this.state.open && !this.state.error) &&
            <Keyboard
              script="bali"
              onTextChange={this.textChange}
              text={this.state.text}
              caretPos={this.state.caretPos}
            />
          }
        </div>
        {(this.state.open && !this.state.error) ?
          <button
            className="tr-close-button"
            onClick={this.handleClose}
          >
            <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
            <FontAwesomeIcon icon={faTimes} />
          </button>
          :
          <button
            className="tr-open-button"
            onClick={this.handleOpen}
          >
            <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes" />
            <FontAwesomeIcon icon={faKeyboard} />
          </button>
        }
      </div>
    );
  }
}

import React, { Component } from 'react';
import PinchZoomPan from 'react-responsive-pinch-zoom-pan';
import { Swipeable } from 'react-swipeable';
import cx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faKeyboard, faFont } from '@fortawesome/free-solid-svg-icons';

import styles from './App.module.scss';
import Keyboard from './Keyboard';

let entryImageUrl = window.entryImageUrl;
let iiifBaseUrl = "https://iiif.archivelab.org/iiif";

const blockPinchZoom = e => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}

// const blockTapZoom = e => {
//   e.preventDefault();
//   e.target.click();
// }

const getSelection = () => {
  let sel = window.getSelection();
  return sel.anchorNode && sel.isCollapsed
    ? { node: sel.anchorNode, caretPos: sel.anchorOffset }
    : null;
}

const getCaretRangeFromPoint = e => {
  let range = document.caretRangeFromPoint(e.clientX, e.clientY);
  return range && range.collapsed
    ? { node: range.commonAncestorContainer, caretPos: range.startOffset }
    : null;
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.caretRef = React.createRef();
    this.textbox = document.getElementById("wpTextbox1");

    this.detectPlatform();
    this.detectGetSelection();
    this.viewportFix();

    this.state = {
      text: "",
      caretPos: 0,
      open: true,
      error: false,
      transliteration: "",
      transliterationOpen: false,
      keyboardOpen: !(window.localStorage.getItem("keyboardOpen") === "false"),
    };
  }

  detectPlatform = () => {
    let ua = window.navigator.userAgent;
    this.isIOS = ua.match(/iPhone|iPod|iPad/);
    this.isIOSSafari = this.isIOS && ua.match(/WebKit/) && !ua.match(/CriOS/);
    this.isMobile = this.isIOS || ua.match(/Android/);
  }

  detectGetSelection = () => {
    let [ supported, func ] = this.isIOS
      ? [ document.caretRangeFromPoint, getCaretRangeFromPoint ]
      : [ window.getSelection, getSelection ];

    this.getSelection = supported
      ? func
      : () => null;
  }

  viewportFix = () => {
    if (this.isMobile) {
      document.documentElement.style.setProperty("--vh", this.getVhPx());
      window.addEventListener("resize", () => {
        document.documentElement.style.setProperty("--vh", this.getVhPx());
      });
    }
  }

  getVhPx = () => {
    let height = document.documentElement.clientHeight;
    return (height * 0.01) + "px";
  }

  componentDidMount = () => {
    this.checkTags();
    this.afterOpen();
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.state.keyboardOpen &&
      (this.state.caretPos !== prevState.caretPos || this.state.text !== prevState.text)) {
      this.scrollToCaret();
    }
  }

  checkTags = () => {
    let error = false;
    let openTags = this.textbox.value.match(/<transcription>/g);
    let closeTags = this.textbox.value.match(/<\/transcription>/g);
    if (!openTags || !closeTags || (openTags && openTags.length !== 1) || (closeTags && closeTags.length !== 1)) {
      error = true;
      alert("Transcription tags are malformed!");
    }
    this.setState({ error });
  }

  handleOpen = () => {
    this.checkTags();
    this.setState({ open: true }, this.afterOpen);
  }

  afterOpen = () => {
    if (!this.error) {
      if (this.isIOSSafari) {
        document.addEventListener("touchmove", blockPinchZoom, { passive: false });
        //document.addEventListener("touchend", blockTapZoom, { passive: false });
      }
      document.body.classList.add(styles.noscroll);
      document.addEventListener("keydown", this.handleKeydown);

      this.getArchiveItem();
      this.getTranscription();
    }
  }

  handleClose = () => {
    if (this.isIOSSafari) {
      document.removeEventListener("touchmove", blockPinchZoom);
      //document.removeEventListener("touchend", blockTapZoom);
    }
    document.body.classList.remove(styles.noscroll);
    document.removeEventListener("keydown", this.handleKeydown);
    this.setState({ open: false }, this.setTranscription);
  }

  handleKeydown = e => {
    if (e.key === "Escape" && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
      this.handleClose();
      e.preventDefault();
    }
  }

  getArchiveItem = () => {
    let matches = this.textbox.value.match(/\bEntryID=(\S+).*\bTitle=(\S+)/s);
    if (matches) {
      this.archiveItem = { id: matches[1], leaf: matches[2] };
      this.archiveItemKey = this.archiveItem.id + "$" + this.archiveItem.leaf;
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
    if (this.archiveItemKey) {
      let savedText = window.localStorage.getItem(this.archiveItemKey);
      if (savedText) {
        savedText = savedText.trim();
        if (savedText !== text) {
          let useSaved = window.confirm("It looks like your work was interrupted. Do you want to restore your previous work?");
          if (useSaved) {
            this.setState({ text: savedText, caretPos: savedText.length });
          }
        }
        window.localStorage.removeItem(this.archiveItemKey);
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

    if (this.archiveItemKey) {
      window.localStorage.removeItem(this.archiveItemKey);
    }
  }

  textChange = (text, caretPos = 0) => {
    this.setState({ text, caretPos });
    if (this.archiveItemKey) {
      window.localStorage.setItem(this.archiveItemKey, text);
    }
  }

  textChangeTextArea = e => {
    if (e.target.value !== this.state.text) {
      this.textChange(e.target.value);
    }
  }

  toggleKeyboard = () => {
    let keyboardOpen = !this.state.keyboardOpen;
    this.setState({ keyboardOpen });
    window.localStorage.setItem("keyboardOpen", keyboardOpen);
  }

  handleCaretMove = e => {
    let sel = this.getSelection(e);
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

  setTransliterationOpen = transliterationOpen => {
    if (transliterationOpen !== this.state.transliterationOpen) {
      if (transliterationOpen) {
        if (this.state.text.trim().length) {
          this.getTransliteration().then(transliteration => {
            this.setState({ transliterationOpen, transliteration });
          });
        }
      } else {
        this.setState({ transliterationOpen });
      }
    }
  }

  showTransliteration = () => {
    this.setTransliterationOpen(true);
  }

  hideTransliteration = () => {
    this.setTransliterationOpen(false);
  }

  toggleTransliteration = () => {
    this.setTransliterationOpen(!this.state.transliterationOpen);
  }

  getTransliteration = () => {
    return new Promise((resolve, reject) => {
      window.fetch("https://bali.panlex.org/transliterate", {
        method: "POST",
        body: this.state.text
      }).then(res => {
        res.text().then(resolve, reject);
      }, reject);
    });
  }

  imageChange = state => {
    this.imageState = state;
  }

  getImageRegionUrl = () => {
    if (this.imageState && this.archiveItem) {
      let { left, top, scale, containerDimensions, imageDimensions } = this.imageState;
      let xPct = (-100 * left / (imageDimensions.width * scale)).toFixed(2);
      let yPct = (-100 * top / (imageDimensions.height * scale)).toFixed(2);
      let widthPct = (100 * containerDimensions.width / (imageDimensions.width * scale)).toFixed(2);
      let heightPct = (100 * containerDimensions.height / (imageDimensions.height * scale)).toFixed(2);

      return `${iiifBaseUrl}/${this.archiveItem.id}%24${this.archiveItem.leaf}/pct:${xPct},${yPct},${widthPct},${heightPct}/full/0/default.jpg`;
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className={styles.App}>
        <div className={cx(styles.transcriber, (!this.state.open || this.state.error) && styles.closed)}>
          <div className={cx(styles.image, !this.state.keyboardOpen && styles.expanded)}>
            <PinchZoomPan maxScale={5} doubleTapBehavior="zoom" zoomButtons={!this.isMobile} onChange={this.imageChange}>
              <img id="lontar" alt="lontar" src={entryImageUrl} />
            </PinchZoomPan>
          </div>
          {this.state.keyboardOpen ?
            <Swipeable
              onSwipedLeft={this.showTransliteration}
              onSwipedRight={this.showTransliteration}
            >
              <div className={cx(styles.text)} onClick={this.handleCaretMove}>
                {this.state.text.slice(0, this.state.caretPos)}
                <span className={styles.caret} ref={this.caretRef}></span>
                {this.state.text.slice(this.state.caretPos)}
              </div>
            </Swipeable>
          :
            <textarea
              className={cx(styles.text, !this.state.keyboardOpen && styles.expanded)}
              value={this.state.text}
              onChange={this.textChangeTextArea}
            />
          }
          <div
            className={cx(styles.transliteration, this.state.transliterationOpen && styles.visible, !this.state.keyboardOpen && styles.expanded)}
            onClick={this.isMobile && this.hideTransliteration}
          >
            <div className={styles.transliterationText}>
              {this.state.transliteration}
            </div>
          </div>
          {this.state.open && !this.state.error && this.state.keyboardOpen &&
            <Keyboard
              script="bali"
              onTextChange={this.textChange}
              text={this.state.text}
              caretPos={this.state.caretPos}
            />
          }
        </div>
        {(this.state.open && !this.state.error) ?
          <div className={styles.buttons}>
            {!this.isMobile &&
              <>
                <button
                  className={styles.button}
                  onClick={this.toggleTransliteration}
                >
                  <FontAwesomeIcon icon={faFont} />
                </button>
                <button
                  className={styles.button}
                  onClick={this.toggleKeyboard}
                >
                  <FontAwesomeIcon icon={faKeyboard} />
                </button>
              </>
            }
            <button
              className={styles.button}
              onClick={this.handleClose}
            >
              <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          :
          <button
            className={styles.openButton}
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

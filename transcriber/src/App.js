import React, { Component } from 'react';
import PinchZoomPan from 'react-responsive-pinch-zoom-pan';
import cx from 'clsx';
import Popup from 'reactjs-popup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faKeyboard, faEllipsisV } from '@fortawesome/free-solid-svg-icons';

import styles from './App.module.scss';
import Keyboard from './Keyboard';

const iiifBaseUrl = "https://iiif.archivelab.org/iiif";
const platform = detectPlatform();
const getSelection = detectGetSelection();

viewportFix();

function detectPlatform() {
  let ua = window.navigator.userAgent;
  let platform = {};
  platform.iOS = ua.match(/iPhone|iPod|iPad/);
  platform.iOSSafari = platform.iOS && ua.match(/WebKit/) && !ua.match(/CriOS/);
  platform.mobile = platform.iOS || ua.match(/Android/);
  return platform;
}

function detectGetSelection() {
  if (platform.iOS) {
    if (document.caretRangeFromPoint) {
      return e => {
        let range = document.caretRangeFromPoint(e.clientX, e.clientY);
        return range && range.collapsed
          && { node: range.commonAncestorContainer, caretPos: range.startOffset };
      };
    }
  } else {
    if (window.getSelection) {
      return () => {
        let sel = window.getSelection();
        return sel.anchorNode && sel.isCollapsed
          && { node: sel.anchorNode, caretPos: sel.anchorOffset };
      };
    }
  }
}

function viewportFix() {
  if (platform.mobile) {
    document.documentElement.style.setProperty("--vh", getVhPx());
    window.addEventListener("resize", () => {
      document.documentElement.style.setProperty("--vh", getVhPx());
    });
  }
}

function getVhPx() {
  let height = document.documentElement.clientHeight;
  return (height * 0.01) + "px";
}

function blockPinchZoom(e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}

// function blockTapZoom(e) {
//   e.preventDefault();
//   e.target.click();
// }

const MenuItem = props => {
  let { label, close, onClick } = props;
  return (
    <div className={styles.menuItem} onClick={e => { close(); onClick(e); }}>{label}</div>
  )
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.caretRef = React.createRef();
    this.textAreaRef = React.createRef();
    this.textbox = document.getElementById("wpTextbox1");
    this.imageUrl = window.entryImageUrl;
    this.emulateTextEdit = platform.mobile;

    this.state = {
      open: this.checkTags(),
      keyboardOpen: !(window.localStorage.getItem("keyboardOpen") === "false"),
      font: window.localStorage.getItem("font") || "vimala",
      transliteration: "",
      transliterationOpen: false,
    };

    if (this.state.open) {
      this.state = { ...this.state, ...this.finalizeOpen() };
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.open) {
      if (this.state.keyboardOpen &&
        (this.state.caretPos !== prevState.caretPos || this.state.text !== prevState.text))
      {
        this.scrollToCaret();
      } else {
        this.focusTextArea();
      }
    }
  }

  checkTags() {
    let shouldOpen = true;
    let openTags = this.textbox.value.match(/<transcription>/g);
    let closeTags = this.textbox.value.match(/<\/transcription>/g);
    if ((openTags || closeTags) &&
      (!(openTags && openTags.length === 1 && closeTags && closeTags.length === 1) ||
      !(this.textbox.value.indexOf("<transcription>") < this.textbox.value.indexOf("</transcription>")))
    ) {
      shouldOpen = false;
      alert("Transcription tags are malformed!");
    }
    return shouldOpen;
  }

  handleOpen = () => {
    if (this.checkTags()) {
      this.setState({ open: true, ...this.finalizeOpen() });
    }
  }

  finalizeOpen = () => {
    if (platform.iOSSafari) {
      document.addEventListener("touchmove", blockPinchZoom, { passive: false });
      //document.addEventListener("touchend", blockTapZoom, { passive: false });
    }
    document.body.classList.add(styles.noscroll);
    document.addEventListener("keydown", this.handleKeyDown);

    this.loadArchiveItem();
    this.loadIiifDimensions();
    return this.loadTranscription();
  }

  handleClose = () => {
    if (platform.iOSSafari) {
      document.removeEventListener("touchmove", blockPinchZoom);
      //document.removeEventListener("touchend", blockTapZoom);
    }
    document.body.classList.remove(styles.noscroll);
    document.removeEventListener("keydown", this.handleKeyDown);
    this.setState({ open: false });
    this.saveTranscription();
  }

  handleKeyDown = e => {
    if (e.key === "Escape" && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
      this.handleClose();
      e.preventDefault();
    } else {
      this.focusTextArea();
    }
  }

  loadArchiveItem() {
    let matches = this.textbox.value.match(/\bEntryID=(\S+).*\bTitle=(\S+)/s);
    if (matches) {
      this.archiveItem = { id: matches[1], leaf: matches[2] };
      this.archiveItemKey = this.archiveItem.id + "$" + this.archiveItem.leaf;
      this.iiifUrl = `${iiifBaseUrl}/${this.archiveItem.id}%24${this.archiveItem.leaf}`;
    }
  }

  loadIiifDimensions() {
    let matches = this.textbox.value.match(/\bFullSize=([0-9]+)x([0-9]+)/);
    if (matches) {
      this.iiifDimensions = { width: matches[1], height: matches[2] };
    }
  }

  loadTranscription() {
    let matches = this.textbox.value.match(/(?:.*<transcription>)(.*?)(?:<\/transcription>.*)/s);
    if (matches) {
      let text = matches[1].trim();
      setTimeout(() => this.checkStoredText(text), 1000);
      return { text, caretPos: text.length };
    } else {
      return { text: "", caretPos: 0 };
    }
  }

  checkStoredText(text) {
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

  saveTranscription = () => {
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

  handleTextChange = (text, caretPos) => {
    if (text !== null) {
      this.setState({ text, caretPos });
      if (this.archiveItemKey) {
        window.localStorage.setItem(this.archiveItemKey, text);
      }
    } else if (this.state.caretPos !== caretPos) {
      this.setState({ caretPos });
    }
  }

  handleKeyPress = preText => {
    let ta = this.textAreaRef.current;
    this.setState({ text: preText + ta.value.slice(ta.selectionEnd), caretPos: preText.length });
  }

  handleCaretMove = e => {
    let sel = getSelection && getSelection(e);
    if (sel) {
      let { node, caretPos } = sel;

      while (node.previousSibling) {
        node = node.previousSibling;
        if (node.nodeType === 3) {
          caretPos += node.nodeValue.length;
        }
      }

      if (this.state.caretPos !== caretPos) {
        this.setState({ caretPos });
      }
    }
  }

  scrollToCaret() {
    if (this.emulateTextEdit) {
      let caret = this.caretRef.current;
      caret.offsetParent.scrollTop = caret.offsetTop;
    } else {
      let ta = this.textAreaRef.current;
      let { caretPos } = this.state;
      if (ta.selectionStart !== caretPos) {
        ta.setSelectionRange(caretPos, caretPos);
      }
      ta.focus();
    }
  }

  focusTextArea() {
    if (!this.emulateTextEdit && document.activeElement !== this.textAreaRef.current) {
      this.textAreaRef.current.focus();
    }
  }

  toggleKeyboard = () => {
    let keyboardOpen = !this.state.keyboardOpen;
    this.setState({ keyboardOpen });
    if (keyboardOpen && !this.emulateTextEdit) {
      this.setState({ caretPos: this.textAreaRef.current.selectionStart });
    }
    window.localStorage.setItem("keyboardOpen", keyboardOpen);
  }

  toggleFont = () => {
    let font = this.state.font === "vimala" ? "pustaka" : "vimala";
    this.setState({ font });
    window.localStorage.setItem("font", font);
  }

  setTransliterationOpen(transliterationOpen) {
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

  toggleTransliteration = () => {
    this.setTransliterationOpen(!this.state.transliterationOpen);
  }

  getTransliteration() {
    return new Promise((resolve, reject) => {
      window.fetch("/w/api.php", {
        method: "POST",
        body: new URLSearchParams({
          action: "transliterate",
          format: "json",
          transliterator: "Balinese-ban_001",
          text: this.state.text
        })
      }).then(res => {
        res.json().then(json => resolve(json.transliteration), reject);
      }, reject);
    });
  }

  render() {
    let { open, text, caretPos, keyboardOpen, transliterationOpen, font } = this.state;

    return (
      <div className={styles.App}>
        <div className={cx(styles.transcriber, !open && styles.closed)}>
          <div className={cx(styles.image, !keyboardOpen && styles.expanded)}>
            <PinchZoomPan
              imageUrl={this.imageUrl}
              iiifUrl={this.iiifUrl}
              iiifDimensions={this.iiifDimensions}
              maxScale={5}
              enhanceScale={1.5}
              doubleTapBehavior="zoom"
              zoomButtons={!platform.mobile}
            />
          </div>
          {this.emulateTextEdit ?
            <div className={cx(styles.text, styles[font])} onClick={this.handleCaretMove}>
              {text.slice(0, caretPos)}
              <span className={styles.caret} ref={this.caretRef}></span>
              {text.slice(caretPos)}
            </div>
          :
            <textarea
              className={cx(styles.text, styles[font], !keyboardOpen && styles.expanded)}
              value={text}
              ref={this.textAreaRef}
              onChange={e => this.handleTextChange(e.target.value, e.target.selectionStart)}
              onSelect={keyboardOpen ? (e => this.handleTextChange(null, e.target.selectionStart)) : undefined}
            />
          }
          <div
            className={cx(styles.transliteration, transliterationOpen && styles.visible, !keyboardOpen && styles.expanded)}
            onClick={platform.mobile && (() => this.setTransliterationOpen(false))}
          >
            <div className={styles.transliterationText}>
              {this.state.transliteration}
            </div>
          </div>
          {open && keyboardOpen &&
            <Keyboard
              script="bali"
              className={styles[font]}
              emulateTextEdit={this.emulateTextEdit}
              onTextChange={this.handleTextChange}
              onKeyPress={this.handleKeyPress}
              text={text}
              caretPos={caretPos}
            />
          }
        </div>
        {open ?
          <div className={cx(styles.buttons, platform.mobile ? styles.vert : styles.horiz)}>
            <button
              className={styles.button}
              onClick={this.handleClose}
            >
              <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <Popup
              on="click"
              contentStyle={{width: '12em'}}
              trigger={<button className={styles.button}><FontAwesomeIcon icon={faEllipsisV} /></button>}
              position="bottom right"
            >
              {close => (
                <>
                  <MenuItem close={close}
                    label={(transliterationOpen ? "Hide" : "Show") + " Transliteration"}
                    onClick={this.toggleTransliteration}
                  />
                  <MenuItem close={close}
                    label={"Set Font to " + (font === "vimala" ? "Pustaka" : "Vimala")}
                    onClick={this.toggleFont}
                  />
                  {!platform.mobile &&
                    <MenuItem close={close}
                      label={(keyboardOpen ? "Hide" : "Show") + " Keyboard"}
                      onClick={this.toggleKeyboard}
                    />
                  }
                </>
              )}
            </Popup>
          </div>
          :
          <button
            className={cx(styles.button,styles.open)}
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

import React, { Component, useState } from "react";
import cx from "clsx";

//import NonPrintingKeys from "./NonPrintingKeys.js";
import styles from "./Keyboard.module.scss";
import zwnj from "./zwnj.svg";
import zwj from "./zwj.svg";
import layouts from "./layouts.js";

const stringInsert = (string, addition, caretPos) => {
  caretPos = caretPos === undefined ? string.length : caretPos;
  let preString = string.slice(0, caretPos);
  let postString = string.slice(caretPos);
  for (const c of addition) {
    if (c === "\u0008") {
      preString = preString.slice(0, -1);
    } else if (c === "\u007f") {
      postString = postString.slice(1);
    } else {
      preString += c;
    }
  }
  return [preString, postString];
}

const Key = props => {
  const [zoom, setZoom] = useState(false);
  return (
    <div
      style={{ gridArea: props.gridArea }}
      className={cx(
        props.className,
        styles.key,
        !props.unzoomable && zoom && styles.zoom,
        props.flash && zoom && styles.flash
      )}
      onClick={props.onClick}
      onPointerDown={() => setZoom(true)}
      onPointerUp={() => {
        // props.onClick();
        setZoom(false);
      }}
      onPointerLeave={() => setZoom(false)}
    >
      {props.img ? <img src={props.img} alt={props.text} /> : props.text}
    </div>
  )
}

const gridToStyle = grid => ({
  gridTemplateAreas: grid.map(row => `"${row.join(" ")}"`).join("\n"),
  gridTemplateRows: `repeat(${grid.length}, ${100 / grid.length}%)`,
  gridTemplateColumns: `repeat(${grid[0].length}, ${100 / grid[0].length}%)`
})

export default class Keyboard extends Component {
  constructor(props) {
    super(props);
    this.physBufferRef = React.createRef();
    this.state = {
      layout: layouts[props.script].letters,
      currLayout: {},
      layoutMatches: {},
      shiftLevel: 0,
    }
  }

  componentDidMount() {
    window.addEventListener("keydown", this.props.emulateTextEdit ? this.handlePhysKeyDownEmulated : this.handlePhysKeyDown);
    window.addEventListener("keyup", this.handlePhysKeyUp);
    this.updateKeyboard(this.props.text);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.props.emulateTextEdit ? this.handlePhysKeyDownEmulated : this.handlePhysKeyDown);
    window.removeEventListener("keyup", this.handlePhysKeyUp);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.text !== prevProps.text ||
      this.props.caretPos !== prevProps.caretPos ||
      this.state.shiftLevel !== prevState.shiftLevel ||
      this.state.layout !== prevState.layout
    ) {
      this.updateKeyboard(this.props.text);
    }
  }

  updateKeyboard() {
    const buffer = this.props.text.slice(0, this.props.caretPos);
    const layout = this.state.layout.keys;
    const currLayout = this.state.currLayout;
    const layoutMatches = this.state.layoutMatches;
    for (const type in layout) {
      layout[type].some(([rx, keys]) => {
        const found = buffer.match(rx);
        if (found) {
          currLayout[type] = keys[this.state.shiftLevel] || keys[0];
          layoutMatches[type] = found[0];
          return true;
        } else {
          return false;
        }
      })
    }
    this.setState({ currLayout, layoutMatches });
  }

  handleKeyPress(k) {
    this.setState({ shiftLevel: 0 });
    const [preText, postText] = stringInsert(this.props.text, k, this.props.caretPos);

    if (this.props.emulateTextEdit) {
      this.props.onTextChange(preText + postText, preText.length);
    } else {
      this.props.onKeyPress(preText);
    }
  }

  handleArrow(dir) {
    let { caretPos } = this.props;
    if (dir === "←") {
      caretPos--;
    } else if (dir === "→") {
      caretPos++;
    }
    this.props.onTextChange(this.props.text, caretPos);
  }

  handlePhysKeyDown = e => {
    if (e.key === "Shift") {
      this.setState({ shiftLevel: 1 });
      e.preventDefault();
    }
  }

  handlePhysKeyDownEmulated = e => {
    let preventDefault = false;

    if (e.key === "Shift") {
      this.setState({ shiftLevel: 1 });
      preventDefault = true;
    } else if (!e.isComposing) {
      if (e.key === "Backspace") {
        this.handleKeyPress("\u0008");
        preventDefault = true;
      } else if (e.key === "Delete") {
        this.handleKeyPress("\u007f");
        preventDefault = true;
      } else if (e.key === "Enter") {
        this.handleKeyPress("\n");
        preventDefault = true;
      } else if (e.key === "ArrowLeft") {
        this.handleArrow("←");
        preventDefault = true;
      } else if (e.key === "ArrowRight") {
        this.handleArrow("→");
        preventDefault = true;
      }
    }

    if (preventDefault) {
      e.preventDefault();
    } else if (document.activeElement !== this.physBufferRef.current
      && !(e.key === "Meta" || e.key === "Control" || e.key === "Alt")
      && !(e.key === "c" && (e.ctrlKey || e.metaKey))
    ) {
      this.physBufferRef.current.focus();
      this.physBufferRef.current.dispatchEvent(new KeyboardEvent("keydown", {
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        repeat: e.repeat,
        isComposing: e.isComposing,
        charCode: e.charCode,
        keyCode: e.keyCode,
        which: e.which,
      }));
    }
  }

  handlePhysKeyUp = e => {
    if (e.key === "Shift") {
      this.setState({ shiftLevel: 0 });
      e.preventDefault();
    }
  }

  handlePhysBufferInput = e => {
    if (e.target.value.length && !e.nativeEvent.isComposing) {
      this.handleKeyPress(e.target.value);
      e.target.value = "";
    }
  }

  render() {
    const { script, className } = this.props;
    const { layout, layoutMatches, currLayout, shiftLevel } = this.state;
    const keySet = new Set(layout.grid.flat());

    return (
      <div
        className={cx(styles.keyboard, className)}
        style={gridToStyle(layout.grid)}
      >
        {Object.entries(currLayout).map(([type, keys]) => keys.map((key, k) => (
          <Key
            gridArea={type + k}
            className={styles[type]}
            text={key ? stringInsert(layoutMatches[type], key).join("") : ""}
            key={type + k}
            onClick={() => this.handleKeyPress(key)}
          />
        )))}
        {keySet.has("zwnj") &&
          <Key gridArea="zwnj" img={zwnj} text="zwnj" onClick={() => this.handleKeyPress("\u200c")} />
        }
        {keySet.has("zwj") &&
          <Key gridArea="zwj" img={zwj} text="zwj" onClick={() => this.handleKeyPress("\u200d")} />
        }
        {keySet.has("shift") &&
          <Key gridArea="shift" text={shiftLevel ? "⬆" : "⇧"} onClick={() => this.setState({ shiftLevel: shiftLevel === 0 ? 1 : 0 })} unzoomable flash />
        }
        {keySet.has("backspace") &&
          <Key gridArea="backspace" text="⌫" onClick={() => this.handleKeyPress("\u0008")} unzoomable flash />
        }
        {keySet.has("delete") &&
          <Key gridArea="delete" text="⌦" onClick={() => this.handleKeyPress("\u007f")} unzoomable flash />
        }
        {keySet.has("numbers") &&
          <Key gridArea="numbers" text="᭗᭘᭙" unzoomable flash onClick={() => this.setState({ layout: layouts[script].numbers })} />
        }
        {keySet.has("letters") &&
          <Key gridArea="letters" text="ᬳᬦᬘ" unzoomable flash onClick={() => this.setState({ layout: layouts[script].letters })} />
        }
        {keySet.has("space") &&
          <Key gridArea="space" text="␣" className={styles.space} onClick={() => this.handleKeyPress(" ")} unzoomable flash />
        }
        {keySet.has("return") &&
          <Key gridArea="return" text="⏎" className={styles.return} onClick={() => this.handleKeyPress("\n")} unzoomable flash />
        }
        {keySet.has("arrowleft") &&
          <Key gridArea="arrowleft" text="←" className={styles.arrowleft} onClick={() => this.handleArrow("←")} unzoomable flash />
        }
        {keySet.has("arrowright") &&
          <Key gridArea="arrowright" text="→" className={styles.arrowright} onClick={() => this.handleArrow("→")} unzoomable flash />
        }
        {this.props.emulateTextEdit &&
          <input id="phys-key-buffer" ref={this.physBufferRef} onKeyUp={this.handlePhysBufferInput} onInput={this.handlePhysBufferInput} />
        }
      </div>
    )
  }

}

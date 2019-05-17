import React, { Component, useState } from 'react';
import NonPrintingKeys from './NonPrintingKeys.js';
import './Keyboard.css';
import zwnj from './zwnj.svg';
import zwj from './zwj.svg';
import layouts from './layouts.js';

const stringInsert = (string, addition, caretPos) => {
  caretPos = caretPos === undefined ? string.length : caretPos;
  let preString = string.slice(0, caretPos);
  let postString = string.slice(caretPos);
  for (let c of addition) {
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
  let className = [
    props.className || "",
    "kb-key",
    (!props.unzoomable && zoom) ? "kb-zoom" : "",
    (props.flash && zoom) ? "kb-flash" : "",
  ].join(" ");
  return (
    <div
      style={{ gridArea: props.gridArea }}
      className={className}
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
    this.state = {
      layout: layouts[props.script].letters,
      currLayout: {},
      layoutMatches: {},
      shiftLevel: 0,
    }
  }

  componentDidMount = () => {
    window.addEventListener("keydown", this.handlePhysKeydown);
    window.addEventListener("keyup", this.handlePhysKeyup);
    this.updateKeyboard(this.props.text);
  }

  componentWillUnmount = () => {
    window.removeEventListener("keydown", this.handlePhysKeydown);
    window.removeEventListener("keyup", this.handlePhysKeyup);
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (
      this.props.text !== prevProps.text ||
      this.props.caretPos !== prevProps.caretPos ||
      this.state.shiftLevel !== prevState.shiftLevel ||
      this.state.layout !== prevState.layout
    ) {
      this.updateKeyboard(this.props.text);
    }
  }

  updateKeyboard = () => {
    let buffer = this.props.text.slice(0, this.props.caretPos);
    let layout = this.state.layout.keys;
    let currLayout = this.state.currLayout;
    let layoutMatches = this.state.layoutMatches;
    for (let type in layout) {
      layout[type].some(([rx, keys]) => {
        let found = buffer.match(rx);
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

  handleKeypress = k => {
    this.setState({ shiftLevel: 0 });
    let [preText, postText] = stringInsert(this.props.text, k, this.props.caretPos);
    this.props.onTextChange(preText + postText, preText.length);
  }

  handleArrow = dir => {
    let caretPos = this.props.caretPos;
    if (dir === "←") {
      caretPos--;
    } else if (dir === "→") {
      caretPos++;
    }
    this.props.onTextChange(this.props.text, caretPos)
  }

  handlePhysKeydown = e => {
    if (e.altKey || e.ctrlKey || e.metaKey) {
      if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
        navigator.clipboard.readText().then(clipboardText => {
          let text = this.props.text.slice(0, this.props.caretPos) + clipboardText + this.props.text.slice(this.props.caretPos);
          if (text !== this.props.text) {
            this.props.onTextChange(text, this.props.caretPos + clipboardText.length);
          }
        }, () => {});
      } else {
        return;
      }
    } else {
      if (!NonPrintingKeys.has(e.key)) {
        this.handleKeypress(e.key);
      } else if (e.key === "Shift") {
        this.setState({ shiftLevel: 1 });
      } else if (e.key === "Backspace") {
        this.handleKeypress("\u0008");
      } else if (e.key === "Delete") {
        this.handleKeypress("\u007f");
      } else if (e.key === "Enter") {
        this.handleKeypress("\n");
      } else if (e.key === "ArrowLeft") {
        this.handleArrow("←");
      } else if (e.key === "ArrowRight") {
        this.handleArrow("→");
      } else {
        return;
      }
    }

    e.preventDefault();
  }

  handlePhysKeyup = e => {
    if (e.key === "Shift") {
      this.setState({ shiftLevel: 0 });
      e.preventDefault();
    }
  }

  render() {
    let keySet = new Set(this.state.layout.grid.flat());
    return (
      <div
        className="keyboard"
        style={gridToStyle(this.state.layout.grid)}
      >
        {Object.entries(this.state.currLayout).map(([type, keys]) => keys.map((key, k) => (
          <Key
            gridArea={type + k}
            className={type}
            text={key ? stringInsert(this.state.layoutMatches[type], key).join("") : ""}
            key={type + k}
            onClick={e => this.handleKeypress(key)}
          />
        )))}
        {keySet.has("zwnj") &&
          <Key gridArea="zwnj" img={zwnj} text="zwnj" onClick={() => this.handleKeypress("\u200c")} />
        }
        {keySet.has("zwj") &&
          <Key gridArea="zwj" img={zwj} text="zwj" onClick={() => this.handleKeypress("\u200d")} />
        }
        {keySet.has("shift") &&
          <Key gridArea="shift" text={this.state.shiftLevel ? "⬆" : "⇧"} onClick={() => this.setState({ shiftLevel: this.state.shiftLevel === 0 ? 1 : 0 })} unzoomable flash />
        }
        {keySet.has("backspace") &&
          <Key gridArea="backspace" text="⌫" onClick={() => this.handleKeypress("\u0008")} unzoomable flash />
        }
        {keySet.has("delete") &&
          <Key gridArea="delete" text="⌦" onClick={() => this.handleKeypress("\u007f")} unzoomable flash />
        }
        {keySet.has("numbers") &&
          <Key gridArea="numbers" text="᭗᭘᭙" unzoomable flash onClick={e => this.setState({ layout: layouts[this.props.script].numbers })} />
        }
        {keySet.has("letters") &&
          <Key gridArea="letters" text="ᬳᬦᬘ" unzoomable flash onClick={e => this.setState({ layout: layouts[this.props.script].letters })} />
        }
        {keySet.has("space") &&
          <Key gridArea="space" text="␣" className="space" onClick={e => this.handleKeypress(" ")} unzoomable flash />
        }
        {keySet.has("return") &&
          <Key gridArea="return" text="⏎" className="return" onClick={e => this.handleKeypress("\n")} unzoomable flash />
        }
        {keySet.has("arrowleft") &&
          <Key gridArea="arrowleft" text="←" className="arrowleft" onClick={e => this.handleArrow("←")} unzoomable flash />
        }
        {keySet.has("arrowright") &&
          <Key gridArea="arrowright" text="→" className="arrowright" onClick={e => this.handleArrow("→")} unzoomable flash />
        }

      </div>
    )
  }

}

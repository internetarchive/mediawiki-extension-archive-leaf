import React, { Component, useState } from 'react';
import './Keyboard.css';

const rx = {
  cons: "([ᬅᬓ-ᬳᭅ-ᭋ]\u1b34?\u1b44)*[ᬅᬓ-ᬳᭅ-ᭋ]\u1b34?",
}

const layouts = {
  "bali": {
    letters: {
      grid: [
        ["vowel0", "vowel1", "vowel2", "vowel3", "dvowel0", "dvowel1", "dvowel2", "dvowel3", "dvowel4", "dvowel5"],
        ["vowel4", "vowel5", "vowel6", "vowel7", "dvowel6", "dvowel7", "dvowel8", "dvowel9", "dvowel10", "dvowel11"],
        ["cons0", "cons1", "cons2", "cons3", "cons4", "cons5", "cons6", "cons7", "cons8", "cons9"],
        ["shift", "cons10", "cons11", "cons12", "cons13", "cons14", "cons15", "cons16", "cons17", "backspace"],
        ["numbers", "numbers", "punc0", "space", "space", "space", "space", "punc1", "return", "return"]
      ],
      keys: {
        vowel: [
          [/$/, [
            ["ᬅ", "ᬇ", "ᬉ", "ᬏ",
              "ᬐ", "ᬑ", "ᬋ", "ᬍ"]
          ]]
        ],
        dvowel: [
          [RegExp(rx.cons + "[\u1b35\u1b37\u1b39\u1b40\u1b41\u1b43]$"), [
            ["", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [RegExp(rx.cons + "\u1b3e$"), [
            ["\u0008\u1b40", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [RegExp(rx.cons + "\u1b36$"), [
            ["\u0008\u1b37", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [RegExp(rx.cons + "\u1b38$"), [
            ["\u0008\u1b39", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [RegExp(rx.cons + "\u1b3f$"), [
            ["\u0008\u1b41", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [RegExp(rx.cons + "\u1b42$"), [
            ["\u0008\u1b43", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [RegExp(rx.cons + "\u1b3a$"), [
            ["\u0008\u1b3b", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [RegExp(rx.cons + "\u1b3c$"), [
            ["\u0008\u1b3d", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [/ᬅ$/, [
            ["\u0008\u1b06", "", "", "\u1b02", "\u1b03", "\u1b04",
              "\u1b44", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [/ᬇ$/, [
            ["\u0008\u1b08", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [/ᬉ$/, [
            ["\u0008\u1b0a", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [/ᬑ$/, [
            ["\u0008\u1b12", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [/ᬋ$/, [
            ["\u0008\u1b0c", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [/ᬍ$/, [
            ["\u0008\u1b0e", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [/[ᬆᬈᬊᬏᬐᬒᬌᬎ]$/, [
            ["", "", "", "\u1b02", "\u1b03", "\u1b04",
              "", "", "", "", "", ""],
            ["", "", "", "\u1b00", "\u1b01", "",
              "", "", "", "", "", ""]
          ]],
          [RegExp(rx.cons + "$"), [
            ["\u1b35", "\u1b3e", "\u1b36", "\u1b02", "\u1b03", "\u1b04",
              "\u1b44", "\u1b38", "\u1b3f", "\u1b42", "\u1b3a", "\u1b3c"],
            ["", "", "", "\u1b00", "\u1b01", "\u1b34",
              "", "", "", "", "", ""]
          ]],
          [/$/, [
            ["", "", "", "", "", "",
              "", "", "", "", "", ""]
          ]]
        ],
        cons: [
          [RegExp(rx.cons + "\u1b44$"), [
            ["ᬳ", "ᬦ", "ᬘ", "ᬭ", "ᬓ", "ᬤ", "ᬢ", "ᬲ", "ᬯ", "ᬮ",
              "ᬫ", "ᬕ", "ᬩ", "ᬗ", "ᬧ", "ᬚ", "ᬬ", "ᬜ"],
            ["ᬡ", "ᬙ", "ᬔ", "ᬥ", "ᬟ", "ᬠ", "ᬣ", "ᬝ", "ᬞ", "ᬰ",
              "ᬱ", "ᬖ", "ᬪ", "ᬨ", "ᬛ", "ᭅ", "ᭈ", "ᭊ"]
          ]],
          [/$/, [
            ["ᬳ", "ᬦ", "ᬘ", "ᬭ", "ᬓ", "ᬤ", "ᬢ", "ᬲ", "ᬯ", "ᬮ",
              "ᬫ", "ᬕ", "ᬩ", "ᬗ", "ᬧ", "ᬚ", "ᬬ", "ᬜ"],
            ["ᬡ", "ᬙ", "ᬔ", "ᬥ", "ᬟ", "ᬠ", "ᬣ", "ᬝ", "ᬞ", "ᬰ",
              "ᬱ", "ᬖ", "ᬪ", "ᬨ", "ᬛ", "ᭅ", "ᭈ", "ᭊ"]
          ]]
        ],
        punc: [
          [/$/, [
            ["᭞", "᭟"]
          ]]
        ]
      }
    },
    numbers: {
      grid: [
        ["punc6", "num1", "num2", "num3", "punc7"],
        ["punc0", "num4", "num5", "num6", "punc8"],
        ["punc5", "num7", "num8", "num9", "punc9"],
        ["letters", "punc3", "num0", "punc4", "backspace"]
      ],
      keys: {
        num: [
          [/$/, [
            ["᭐", "᭑", "᭒", "᭓", "᭔", "᭕", "᭖", "᭗", "᭘", "᭙"]
          ]]
        ],
        punc: [
          [/$/, [
            ["᭞", "᭚", "᭛", "᭝", "᭠", "᭟",
              "᭚᭜᭚", "᭛᭜᭛", "᭟᭜᭟", "ᬒᬁ"]
          ]]
        ],

      }
    }
  }
}

const stringConcat = (string, addition) => {
  let newString = string;
  for (let c of addition) {
    if (c === "\u0008") {
      newString = newString.slice(0, -1);
    } else {
      newString = newString + c;
    }
  }
  return newString;
}

const Key = props => {
  const [zoom, setZoom] = useState(false);
  let className = [
    props.className || "",
    "key",
    (!props.unzoomable && zoom) ? "zoom" : "",
    (props.flash && zoom) ? "flash" : "",
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
      <span>{props.text}</span>
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
    this.updateKeyboard(this.props.buffer);
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.props.buffer !== prevProps.buffer) {
      this.updateKeyboard(this.props.buffer);
    } else if (this.state.shiftLevel !== prevState.shiftLevel) {
      this.updateKeyboard(this.props.buffer);
    } else if (this.state.layout !== prevState.layout) {
      this.updateKeyboard(this.props.buffer);
    }
  }

  updateKeyboard = () => {
    let buffer = this.props.buffer;
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
    let buffer = stringConcat(this.props.buffer, k);
    this.props.onBufferChange(buffer);
  }

  render() {
    return (
      <div className="keyboard" style={gridToStyle(this.state.layout.grid)}>
        {Object.entries(this.state.currLayout).map(([type, keys]) => keys.map((key, k) => (
          <Key
            gridArea={type + k}
            className={type}
            text={key ? stringConcat(this.state.layoutMatches[type], key) : ""}
            key={type + k}
            onClick={e => this.handleKeypress(key)}
          />
        )))}
        <Key
          gridArea="shift"
          text={this.state.shiftLevel ? "⬆" : "⇧"}
          onClick={() => this.setState({ shiftLevel: this.state.shiftLevel === 0 ? 1 : 0 })}
          unzoomable
          flash
        />
        <Key
          gridArea="backspace"
          text={"⌫"}
          onClick={() => this.handleKeypress("\u0008")}
          unzoomable
          flash
        />
        <Key gridArea="numbers" text="᭗᭘᭙" unzoomable flash onClick={e => this.setState({ layout: layouts[this.props.script].numbers })} />
        <Key gridArea="letters" text="ᬳᬦᬘ" unzoomable flash onClick={e => this.setState({ layout: layouts[this.props.script].letters })} />
        <Key gridArea="space" text="␣" className="space" onClick={e => this.handleKeypress(" ")} unzoomable flash />
        <Key gridArea="return" text="⮠" className="return" onClick={e => this.handleKeypress("\n")} unzoomable flash />
      </div>
    )
  }

}
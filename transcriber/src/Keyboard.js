import React, { Component, useState } from 'react';
import './Keyboard.css';

const rx = {
  cons: "([ᬓ-ᬳ]\u1b34?\u1b44)*[ᬓ-ᬳ]\u1b34?",
}

const layouts = {
  "bali": {
    style: {
      gridTemplateAreas: `
      "vowel0 vowel1 vowel2 vowel3 dvowel0 dvowel1 dvowel2 dvowel3 dvowel4 dvowel5"
      "vowel4 vowel5 vowel6 vowel7 dvowel6 dvowel7 dvowel8 dvowel9 dvowel10 dvowel11"
      "cons0 cons1 cons2 cons3 cons4 cons5 cons6 cons7 cons8 cons9"
      "shift cons10 cons11 cons12 cons13 cons14 cons15 cons16 cons17 backspace"
      "numbers danda space space space space space space doubledanda newline"
    `,
    },
    vowels: [
      "ᬅ", "ᬇ", "ᬉ", "ᬏ",
      "ᬐ", "ᬑ", "ᬋ", "ᬍ"
    ],
    dependentVowels: [
      [RegExp(rx.cons + "[\u1b35\u1b40\u1b37\u1b39\u1b41\u1b43]$"), [
        "", "", "", "\u1b02", "\u1b03", "\u1b04",
        "", "", "", "", "", ""
      ]],
      [RegExp(rx.cons + "\u1b3e$"), [
        "\u0008\u1b40", "", "", "\u1b02", "\u1b03", "\u1b04",
        "", "", "", "", "", ""
      ]],
      [RegExp(rx.cons + "\u1b36$"), [
        "\u0008\u1b37", "", "", "\u1b02", "\u1b03", "\u1b04",
        "", "", "", "", "", ""
      ]],
      [RegExp(rx.cons + "\u1b38$"), [
        "\u0008\u1b39", "", "", "\u1b02", "\u1b03", "\u1b04",
        "", "", "", "", "", ""
      ]],
      [RegExp(rx.cons + "\u1b3f$"), [
        "\u0008\u1b41", "", "", "\u1b02", "\u1b03", "\u1b04",
        "", "", "", "", "", ""
      ]],
      [RegExp(rx.cons + "\u1b42$"), [
        "\u0008\u1b43", "", "", "\u1b02", "\u1b03", "\u1b04",
        "", "", "", "", "", ""
      ]],
      [RegExp(rx.cons + "\u1b3a$"), [
        "\u0008\u1b3b", "", "", "", "", "",
        "", "", "", "", "", ""
      ]],
      [RegExp(rx.cons + "\u1b3c$"), [
        "\u0008\u1b3d", "", "", "", "", "",
        "", "", "", "", "", ""
      ]],
      [/\u1b05$/, [
        "\u0008\u1b06", "", "", "", "", "",
        "", "", "", "", "", ""
      ]],
      [/\u1b07$/, [
        "\u0008\u1b08", "", "", "", "", "",
        "", "", "", "", "", ""
      ]],
      [/\u1b09$/, [
        "\u0008\u1b0a", "", "", "", "", "",
        "", "", "", "", "", ""
      ]],
      [/\u1b11$/, [
        "\u0008\u1b12", "", "", "", "", "",
        "", "", "", "", "", ""
      ]],
      [/\u1b0b$/, [
        "\u0008\u1b0c", "", "", "", "", "",
        "", "", "", "", "", ""
      ]],
      [/\u1b0d$/, [
        "\u0008\u1b0e", "", "", "", "", "",
        "", "", "", "", "", ""
      ]],
      [RegExp(rx.cons + "$"), [
        "\u1b35", "\u1b3e", "\u1b36", "\u1b02", "\u1b03", "\u1b04",
        "\u1b44", "\u1b38", "\u1b3f", "\u1b42", "\u1b3a", "\u1b3c"
      ]],
      [/$/, [
        "", "", "", "", "", "",
        "", "", "", "", "", ""
      ]]
    ],
    consonants: [
      [RegExp(rx.cons + "\u1b44$"), [
        "ᬳ", "ᬦ", "ᬘ", "ᬭ", "ᬓ", "ᬤ", "ᬢ", "ᬲ", "ᬯ", "ᬮ",
        "ᬫ", "ᬕ", "ᬩ", "ᬗ", "ᬧ", "ᬚ", "ᬬ", "ᬜ"
      ]],
      [/$/, [
        "ᬳ", "ᬦ", "ᬘ", "ᬭ", "ᬓ", "ᬤ", "ᬢ", "ᬲ", "ᬯ", "ᬮ",
        "ᬫ", "ᬕ", "ᬩ", "ᬗ", "ᬧ", "ᬚ", "ᬬ", "ᬜ"
      ]]
    ],
    shiftConsonants: [
      [RegExp(rx.cons + "\u1b44$"), [
        "ᬡ", "ᬙ", "ᬔ", "ᬥ", "ᬟ", "ᬠ", "ᬣ", "ᬝ", "ᬞ", "ᬰ",
        "ᬱ", "ᬖ", "ᬪ", "ᬨ", "ᬛ", "ᭅ", "ᭈ", "ᭊ"
      ]],
      [/$/, [
        "ᬡ", "ᬙ", "ᬔ", "ᬥ", "ᬟ", "ᬠ", "ᬣ", "ᬝ", "ᬞ", "ᬰ",
        "ᬱ", "ᬖ", "ᬪ", "ᬨ", "ᬛ", "ᭅ", "ᭈ", "ᭊ"
      ]]
    ]

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

export default class Keyboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vowels: layouts[props.script].vowels,
      consonants: layouts[props.script].consonants.slice(-1)[0][1],
      dependentVowels: layouts[props.script].dependentVowels.slice(-1)[0][1],
      match: "",
      consonantsMatch: "",
      shift: false,
    }
  }

  componentDidMount = () => {
    this.updateKeyboard(this.props.buffer);
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (this.props.buffer !== prevProps.buffer) {
      this.updateKeyboard(this.props.buffer);
    } else if (this.state.shift !== prevState.shift) {
      this.updateKeyboard(this.props.buffer);
    }
  }

  updateKeyboard = buffer => {
    let dependentVowels = this.state.dependentVowels;
    let match = this.state.match;
    layouts[this.props.script].dependentVowels.some(([rx, dv]) => {
      let found = buffer.match(rx);
      if (found) {
        dependentVowels = dv;
        match = found[0];
        return true;
      } else {
        return false;
      }
    })
    let consonants = this.state.consonants;
    let consonantsMatch = this.state.consonantsMatch;
    let consonantsLayout = this.state.shift ?
      layouts[this.props.script].shiftConsonants :
      layouts[this.props.script].consonants;
    consonantsLayout.some(([rx, c]) => {
      let found = buffer.match(rx);
      if (found) {
        consonants = c;
        consonantsMatch = found[0];
        return true;
      } else {
        return false;
      }
    })
    this.setState({ dependentVowels, match, consonants, consonantsMatch });
  }

  handleKeypress = k => {
    let buffer = stringConcat(this.props.buffer, k);
    this.props.onBufferChange(buffer);
  }

  render() {
    return (
      <div className="keyboard" style={layouts[this.props.script].style}>
        {this.state.vowels.map((letter, k) => (
          <Key
            gridArea={"vowel" + k}
            text={letter}
            key={k}
            onClick={e => this.handleKeypress(letter)} />
        ))}
        {this.state.dependentVowels.map((letter, k) => (
          <Key
            gridArea={"dvowel" + k}
            className="dvowel"
            text={letter ? stringConcat(this.state.match, letter) : ""}
            key={k}
            onClick={e => this.handleKeypress(letter)}
          />
        ))}
        {this.state.consonants.map((letter, k) => (
          <Key
            gridArea={"cons" + k}
            text={letter ? stringConcat(this.state.consonantsMatch, letter) : ""}
            key={k}
            onClick={e => {
              this.handleKeypress(letter);
              this.setState({ shift: false });
            }}
          />
        ))}
        <Key
          gridArea="shift"
          text={this.state.shift ? "⬆" : "⇧"}
          onClick={() => this.setState({ shift: !this.state.shift })}
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
        <Key gridArea="numbers" text="᭗᭘᭙" unzoomable/>
        <Key gridArea="danda" text="᭞" onClick={e => this.handleKeypress("᭞")} />
        <Key gridArea="space" text="␣" className="space" onClick={e => this.handleKeypress(" ")} unzoomable flash/>
        <Key gridArea="doubledanda" text="᭟" onClick={e => this.handleKeypress("᭟")} />
        <Key gridArea="newline" text="⮠" className="newline" onClick={e => this.handleKeypress("\n")} unzoomable flash/>
      </div>
    )
  }

}
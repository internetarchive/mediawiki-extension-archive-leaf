import React, { Component } from 'react';
import './Keyboard.css';

const rx = {
  cons: "([ᬓ-\u1b34]\u1b44)*[ᬓ-\u1b34]",
}

const layouts = {
  "bali": {
    vowels: [
      ["ᬅ", "ᬇ", "ᬉ", "ᬏ"],
      ["ᬐ", "ᬑ", "ᬋ", "ᬍ"]
    ],
    dependentVowels: [
      [RegExp(rx.cons + "[\u1b35\u1b40\u1b37\u1b39\u1b41\u1b43]$"), [
        ["", "", "", "\u1b02", "\u1b03", "\u1b04"],
        ["", "", "", "", "", ""]
      ]],
      [RegExp(rx.cons + "\u1b3e$"), [
        ["\u0008\u1b40", "", "", "\u1b02", "\u1b03", "\u1b04"],
        ["", "", "", "", "", ""]
      ]],
      [RegExp(rx.cons + "\u1b36$"), [
        ["\u0008\u1b37", "", "", "\u1b02", "\u1b03", "\u1b04"],
        ["", "", "", "", "", ""]
      ]],
      [RegExp(rx.cons + "\u1b38$"), [
        ["\u0008\u1b39", "", "", "\u1b02", "\u1b03", "\u1b04"],
        ["", "", "", "", "", ""]
      ]],
      [RegExp(rx.cons + "\u1b3f$"), [
        ["\u0008\u1b41", "", "", "\u1b02", "\u1b03", "\u1b04"],
        ["", "", "", "", "", ""]
      ]],
      [RegExp(rx.cons + "\u1b42$"), [
        ["\u0008\u1b43", "", "", "\u1b02", "\u1b03", "\u1b04"],
        ["", "", "", "", "", ""]
      ]],
      [RegExp(rx.cons + "\u1b3a$"), [
        ["\u0008\u1b3b", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]],
      [RegExp(rx.cons + "\u1b3c$"), [
        ["\u0008\u1b3d", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]],
      [/\u1b05$/, [
        ["\u0008\u1b06", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]],
      [/\u1b07$/, [
        ["\u0008\u1b08", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]],
      [/\u1b09$/, [
        ["\u0008\u1b0a", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]],
      [/\u1b11$/, [
        ["\u0008\u1b12", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]],
      [/\u1b0b$/, [
        ["\u0008\u1b0c", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]],
      [/\u1b0d$/, [
        ["\u0008\u1b0e", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]],
      [RegExp(rx.cons + "$"), [
        ["\u1b35", "\u1b3e", "\u1b36", "\u1b02", "\u1b03", "\u1b04"],
        ["\u1b44", "\u1b38", "\u1b3f", "\u1b42", "\u1b3a", "\u1b3c"]
      ]],
      [/$/, [
        ["", "", "", "", "", ""],
        ["", "", "", "", "", ""]
      ]]
    ],
    consonants: [
      ["ᬳ", "ᬦ", "ᬘ", "ᬭ", "ᬓ", "ᬤ", "ᬢ", "ᬲ", "ᬯ", "ᬮ"],
      ["ᬫ", "ᬕ", "ᬩ", "ᬗ", "ᬧ", "ᬚ", "ᬬ", "ᬜ"]
    ],
    shiftConsonants: [
      ["ᬡ", "ᬙ", "ᬔ", "ᬥ", "ᬟ", "ᬠ", "ᬣ", "ᬝ", "ᬞ", "ᬰ"],
      ["ᬱ", "ᬖ", "ᬪ", "ᬨ", "ᬛ", "ᭅ", "ᭈ", "ᭊ"]
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

export default class Keyboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vowels: layouts[props.script].vowels,
      consonants: layouts[props.script].consonants,
      dependentVowels: [[], []],
      buffer: "",
      match: "",
      shift: false,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.buffer !== prevState.buffer) {
      let dependentVowels = this.state.dependentVowels;
      let match = this.state.match;
      layouts[this.props.script].dependentVowels.some(([rx, dv]) => {
        let found = this.state.buffer.match(rx);
        if (found) {
          dependentVowels = dv;
          match = found[0];
          return true;
        } else {
          return false;
        }
      })
      this.setState({ dependentVowels, match });
      this.props.bufferChange(this.state.buffer);
    }
  }

  handleKeypress = k => {
    let buffer = this.state.buffer;
    this.setState({ buffer: stringConcat(buffer, k) });
  }

  handleBackspace = () => {
    let buffer = this.state.buffer.slice(0, -1);
    this.setState({ buffer });
  }

  handleShift = () => {
    this.setState({
      shift: true,
      consonants: layouts[this.props.script].shiftConsonants
    });
  }

  handleUnshift = () => {
    this.setState({
      shift: false,
      consonants: layouts[this.props.script].consonants
    });
  }

  render() {
    return (
      <div className="keyboard">
        <div className="vowels">
          <div className="independent-vowels">
            {this.state.vowels.map((vowelRow, i) => (
              <div className="key-row" key={i}>
                {vowelRow.map((letter, k) => (
                  <div className="key" key={k} onClick={e => this.handleKeypress(letter)}>
                    {letter}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="dependent-vowels">
            <div className="key-row">
              {this.state.dependentVowels[0].map((letter, k) => (
                <div className="key" key={k} onClick={e => this.handleKeypress(letter)}>
                  {letter ? stringConcat(this.state.match, letter) : ""}
                </div>
              ))}
            </div>
            <div className="key-row">
              {this.state.dependentVowels[1].map((letter, k) => (
                <div className="key" key={k} onClick={e => this.handleKeypress(letter)}>
                  {letter ? stringConcat(this.state.match, letter) : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="consonants">
          <div className="key-row">
            {this.state.consonants[0].map((letter, k) => (
              <div className="key" key={k} onClick={e => {
                this.handleKeypress(letter);
                this.handleUnshift();
              }}>
                {letter}
              </div>
            ))}
          </div>
          <div className="key-row">
            <div className="key" onClick={() => !this.state.shift ? this.handleShift() : this.handleUnshift()}>
              ⇧
            </div>
            {this.state.consonants[1].map((letter, k) => (
              <div className="key" key={k} onClick={e => {
                this.handleKeypress(letter);
                this.handleUnshift();
              }}>
                {letter}
              </div>
            ))}
            <div className="key" onClick={this.handleBackspace}>
              ⌫
            </div>
          </div>
        </div>
        <div className="key-row">
          <div className="key">᭗᭘᭙</div>
          <div className="key">᭞</div>
          <div className="key space">␣</div>
          <div className="key">᭟</div>
        </div>
      </div>
    )
  }

}
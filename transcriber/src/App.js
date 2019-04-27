import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';

import Keyboard from './Keyboard';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      buffer: "",
    };
  }

  handleKeyClick = (k) => {
    this.setState({
      text: this.state.text + k,
    })
  }

  backspace = () => {
    this.setState({
      text: this.state.text.slice(0, -1),
    })
  }

  bufferChange = buffer => {
    this.setState({
      buffer
    })
  }

  render() {
    return (
      <div className="App">
        <div>{window.entryImageUrl}</div>
        <div className="text">
          {this.state.text}
          <span className="buffer">{this.state.buffer}</span>
        </div>
        {[...Array(50).keys()].map((_, i) => (
          <div>blep{i}</div>
        ))}
        <Keyboard
          script="bali"
          bufferChange={this.bufferChange}
        />
      </div>
    );
  }
}

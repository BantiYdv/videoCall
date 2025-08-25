import React, { Component } from "react";
import ChannelForm from "./components/ChannelForm";
import Call from "./components/Call";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      channel: ""
    };
  }

  selectChannel = channel => {
    this.setState({ channel });
  };

  render() {
    return (
      <div className="App" style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#333", marginBottom: "10px" }}>Agora Video Call</h1>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Using token authentication - Channel: <strong>my-room</strong>
          </p>
        </div>
        <ChannelForm selectChannel={this.selectChannel} />
        <Call channel={this.state.channel} />
      </div>
    );
  }
}

export default App;

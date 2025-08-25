import React, { Component } from "react";
import { AGORA_CONFIG } from "../config";

export default class ChannelForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      channel: AGORA_CONFIG.DEFAULT_CHANNEL
    };
  }
  onChange = e => {
    let { name, value } = e.target;
    this.setState({ [name]: value });
  };
  onSubmit = e => {
    e.preventDefault();
    console.log("Submitting ", this.state.channel);
    this.props.selectChannel(this.state.channel);
    this.setState({ channel: AGORA_CONFIG.DEFAULT_CHANNEL });
  };
  render() {
    return (
      <div style={{ textAlign: "center", marginBottom: "30px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
        <form onSubmit={this.onSubmit}>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold", color: "#333" }}>
            Channel Name
          </label>
          <input
            placeholder="Enter channel name"
            name="channel"
            value={this.state.channel}
            onChange={this.onChange}
            style={{
              padding: "10px 15px",
              margin: "0 10px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
              width: "200px"
            }}
          />
          <input 
            type="submit" 
            value="Join Channel" 
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          />
        </form>
      </div>
    );
  }
}

import React, { Component } from 'react';

class ResultsArea extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if(this.props.distance) {
      const resultsDiv = document.getElementById("results");
      resultsDiv.classList.remove("hidden");
    }

    // If the distance is set then print results (Closer to 0, the more similar)
    return (
      <div id="results-area">
        <div id="results" className="flex-container page-wrapper hidden">
          <div id="general-results">
            <div>Result: {this.props.compareResult}</div>
            <div>Your Score: {this.props.distance}</div>
            <div>High Score: {this.props.highScore}</div>
          </div>
          <div id="drawn-image">
            <div>Your Picture</div>
            <img src={this.props.drawnImage} alt="Submitted Drawing" />
          </div>
          <div id="high-score-image">
            <div>Picture of High Score</div>
            <img src={this.props.highScoreImage} alt="Drawing with current High Score" />
          </div>
          <button id="try-again" onClick={this.props.tryAgain}>Try Again</button>
        </div>
      </div>
    );
  }
}

export default ResultsArea;
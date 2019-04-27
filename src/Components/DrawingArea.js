import React, { Component } from 'react';

class DrawingArea extends Component {
  constructor(props) {
    super(props);

    // Start and end position of cursor, used to draw lines on canvas
    this.startPosition = {
        xPos: 0,
        yPos: 0
    }
    this.endPosition = {
        xPos: 0,
        yPos: 0
    }

    this.isDrawing = false;
    this.drawingURL = null;
    this.drawingArea = null;
    this.drawingCanvas = null;
    this.drawingContext = null;
  }

  // Update the position of the cursor
  updatePosition = (e, position) => {
    let canvasBounds = this.drawingCanvas.getBoundingClientRect();

    position.xPos = e.clientX - Math.floor(canvasBounds.left);
    position.yPos = e.clientY - Math.floor(canvasBounds.top);
  };

  // Update the position of the cursor and draw a line from the start
  // position to the end position
  updateAndDraw = (e) => {
    this.updatePosition(e, this.endPosition);
    this.somethingDrawn = true;
    this.drawLine(this.startPosition.xPos, this.startPosition.yPos,
      this.endPosition.xPos, this.endPosition.yPos, "#44429c");
  };

  // Function that runs while drawing on the canvas
  drawing = (e) => {
    if (this.isDrawing) {
        this.updatePosition(e, this.startPosition, this.drawingCanvas);
        setTimeout(this.updateAndDraw, 30, e);
    }
  };

  /* Draw a line on the canvas
     Parameters: startX: starting x position of the line
                 startY: starting y position of the line
                 endX: ending x position of the line
                 endY: ending y position of the line
                 colour: colour of the line
  */
  drawLine = (startX, startY, endX, endY, colour) => {
    this.drawingContext.beginPath();
    this.drawingContext.strokeStyle = colour;
    this.drawingContext.lineWidth = 1.5;
    this.drawingContext.moveTo(startX, startY);
    this.drawingContext.lineTo(endX, endY);
    this.drawingContext.stroke();
    this.drawingContext.closePath();
  };

  // Function that clears the canvas
  clearDrawingArea = () => {
    this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
  };

  // Send the base 64 image to the server and return the result from the server
  saveAndCompareDrawing = async (base64Image) => {
    const response = await fetch('/saveImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pokemonNumber: this.props.pokemonNumber,
        image: base64Image,
        graphImage: this.props.pokeGraph.src,
      }),
    });

    const result = await response.json();

    if (response.status !== 200) throw Error(result.message);

    return result;
  };

  // Save the image currently drawn on the canvas and run saveAndCompareDrawing
  // method, set the results in the parent component
  compareDrawing = () => {
    this.drawingURL = this.drawingCanvas.toDataURL('image/png');
    let modifiedURL = this.drawingURL.replace('data:image/png;base64,', '');

    this.drawingArea.classList.add("hidden");
    this.saveAndCompareDrawing(modifiedURL)
      .then(res => {
        this.props.setResults(this.drawingURL, res.result, res.distance, res.highScore,
          'data:image/gif;base64,' + res.highScoreImage);
      })
      .catch(err => console.log(err));
  };

  // On Component Mount
  componentDidMount = () => {
    this.drawingArea = document.getElementById("drawing-area");
    this.drawingCanvas = document.getElementById("drawing-canvas");
    this.drawingContext = this.drawingCanvas.getContext("2d");

    // Add event listeners to the canvas
    this.drawingCanvas.onmousedown = () => { this.isDrawing = true; };
    this.drawingCanvas.onmousemove = (e) => { this.drawing(e, this.drawingCanvas, this.drawingContext); };
    this.drawingCanvas.onmouseup = () => { this.isDrawing = false; };
  }

  render() {
    // If the graph exists update the canvas width and height based on the graph
    if(this.props.pokeGraph) {
      this.drawingCanvas.width = this.props.pokeGraph.width;
      this.drawingCanvas.height = this.props.pokeGraph.height;
    }

    // Drawing Area: Pokemon Graph, Canvas, Compare Button, Clear Button
    return (
      <div id="drawing-area" className="page-wrapper flex-container">
        <h2>Drawing Challenge</h2>
        <div id="graph-area">
          {
            this.props.pokeGraph 
            ?
            <div>
              <h3>Graph Version</h3>
              <img src={this.props.pokeGraph ? this.props.pokeGraph.src : ''} alt="Graph of Pokemon" /> 
            </div>
            :
            <div>Pokemon is Loading</div>
          }
        </div>
        <div id="canvas-area">
          <h3>Draw Here:</h3>
          <canvas id="drawing-canvas"></canvas>
        </div>
        <button id="compare-button" onClick={this.compareDrawing}>Compare</button>
        <button id="clear-canvas" onClick={this.clearDrawingArea}>Clear Drawing</button>
      </div>
    );
  }
}

export default DrawingArea;
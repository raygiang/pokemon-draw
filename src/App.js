import React, { Component } from 'react';
import './App.css';
import axios from 'axios';

class App extends Component {
  constructor(props) {
    super(props);

    // States
    this.state = {
      pokemonNumber: null,
      pokemon: '',
      sprite: '',
      description: '',
      pokeGraph: null,
      compareResult:null,
      distance: null,
      highScore: null,
      highScoreImage: null,
    };

    // Number of Pokemon
    this.pokeCount = 802;

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

    // Get a random pokemon
    this.getRandPokemon();

    this.drawingURL = '';
  }

  // Get a random pokemon from PokeAPI
  getRandPokemon = () => {
    let pokedexNum = Math.floor(Math.random() * (this.pokeCount - 1)) + 1;
    let pokeApiUrl = 'https://pokeapi.co/api/v2/';

    // Get the name and sprite of the random pokemon
    axios.get(pokeApiUrl + `pokemon/${pokedexNum}`)
      .then(response => {
        this.setState({
          pokemonNumber: response.data.id,
          pokemon: response.data.name.toUpperCase(),
          sprite: response.data.sprites.front_default
        })
      });

    // Get the description of the random pokemon
    axios.get(pokeApiUrl + `pokemon-species/${pokedexNum}`)
      .then(response => {
        for(let i=0; i<response.data.flavor_text_entries.length; i++) {
          if(response.data.flavor_text_entries[i].language.name === "en") {
            this.setState({
              description: response.data.flavor_text_entries[i].flavor_text
            });
            break;
          }
        }
      });
  };

  // Get the graph version of pokemon from Wolfram Alpha API
  getGraphPokemon = () => {
    console.log(process.env.WOLFRAM_KEY);
    let wolframApiUrl = `https://cors-anywhere.herokuapp.com/http://api.wolframalpha.com/v2/query?appid=${process.env.REACT_APP_WOLFRAM_KEY}&input=${this.state.pokemon}+like+curve&includepodid=PlotPod:PopularCurveData&podstate=PlotPod:PopularCurveData__Hide+axes&output=json`;
    axios.get(wolframApiUrl)
      .then(response => {
        if(!response.data.queryresult.pods) {
          this.getRandPokemon();
        }
        this.setState({ 
          pokeGraph : response.data.queryresult.pods[0].subpods[0].img 
        })
      });
  };

  // Update the position of the cursor
  updatePosition = (e, position, canvas) => {
    let canvasBounds = canvas.getBoundingClientRect();

    position.xPos = e.clientX - Math.floor(canvasBounds.left);
    position.yPos = e.clientY - Math.floor(canvasBounds.top);
  };

  // Update the position of the cursor and draw a line from the start
  // position to the end position
  updateAndDraw = (e, drawingCanvas, context) => {
    this.updatePosition(e, this.endPosition, drawingCanvas);
    this.drawLine(context, this.startPosition.xPos, this.startPosition.yPos,
      this.endPosition.xPos, this.endPosition.yPos, "#44429c");
  };

  // Function that runs while drawing on the canvas
  drawing = (e, drawingCanvas, context) => {
    if (this.isDrawing) {
        this.updatePosition(e, this.startPosition, drawingCanvas);
        setTimeout(this.updateAndDraw, 30, e, drawingCanvas, context);
    }
  };

  /* Draw a line on the canvas
     Parameters: context: context of the canvas
                 startX: starting x position of the line
                 startY: starting y position of the line
                 endX: ending x position of the line
                 endY: ending y position of the line
                 colour: colour of the line
  */
  drawLine = (context, startX, startY, endX, endY, colour) => {
    context.beginPath();
    context.strokeStyle = colour;
    context.lineWidth = 1.5;
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
    context.closePath();
  };

  // Send the base 64 image to the server and return the result from the server
  saveAndCompareDrawing = async (base64Image) => {
    const response = await fetch('/saveImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pokemonNumber: this.state.pokemonNumber,
        image: base64Image,
        graphImage: this.state.pokeGraph.src,
      }),
    });

    const result = await response.json();

    if (response.status !== 200) throw Error(result.message);

    return result;
  };

  tryAgain = () => {
    const drawingArea = document.getElementById("drawing-area");
    drawingArea.style.display = "block";

    this.setState({
      compareResult: null,
      distance: null,
      highScore: null,
      highScoreImage: null,
    });
  }

  // On Component Mount
  componentDidMount = () => {
    const drawingArea = document.getElementById("drawing-area");
    const drawingCanvas = document.getElementById("drawing-canvas");
    const context = drawingCanvas.getContext("2d");
    const compareButton = document.getElementById("compare-button");

    // Add event listeners to the canvas
    drawingCanvas.onmousedown = () => { this.isDrawing = true; };
    drawingCanvas.onmousemove = (e) => { this.drawing(e, drawingCanvas, context); };
    drawingCanvas.onmouseup = () => { this.isDrawing = false; };

    // Get the image from the canvas in base64 and send it to the server
    compareButton.onmouseup = async (e) => {
      this.drawingURL = drawingCanvas.toDataURL('image/png');
      let modifiedURL = this.drawingURL.replace('data:image/png;base64,', '');

      drawingArea.style.display = "none";
      this.saveAndCompareDrawing(modifiedURL)
        .then(res => {
          this.setState({
            compareResult: res.result,
            distance: res.distance,
            highScore: res.highScore,
            highScoreImage: 'data:image/gif;base64,' + res.highScoreImage,
          });
        })
        .catch(err => console.log(err));
    };
  }

  render() {
    const drawingCanvas = document.getElementById("drawing-canvas");

    // If a random pokemon has been set but there is no graph yet, get the graph
    if(this.state.pokeGraph === null && this.state.pokemon !== '' && this.state.description !== '') {
      this.getGraphPokemon();
      console.log("get graph");
    }

    // If the graph exists update the canvas width and height based on the graph
    if(this.state.pokeGraph) {
      drawingCanvas.width = this.state.pokeGraph.width;
      drawingCanvas.height = this.state.pokeGraph.height;
    }

    return (
      <div className="page-wrapper">
        <h1>Draw that Pokemon!?</h1>

        {/* Info Area, Pokemon Name, Sprite, and Description */}
        <div id="pokemon-info">
          <h2>{this.state.pokemon}</h2>
          <img src={this.state.sprite} alt={"Picture of " + this.state.pokemon} />
          <h3>{this.state.description}</h3>
        </div>

        {/* Drawing Area, Pokemon Graph, Canvas, Compare Button*/}
        <div id="drawing-area">
          {
            this.state.pokeGraph ?
            <img src={this.state.pokeGraph ? this.state.pokeGraph.src : ''} alt="Graph of Pokemon" /> :
            <div>Pokemon is Loading</div>
          }
          <canvas id="drawing-canvas"
            style={{  
              border: "1px solid #000", 
              margin: "0 1em"
            }}>
          </canvas>
          <button id="compare-button">Compare</button>
        </div>

        {/* If the distance is set then print (Closer to 0, the more similar) */}
        {
          this.state.distance ?
          <div>
            <div>Result: {this.state.distance}</div>
            <div>Your Score: {this.state.distance}</div>
            <div>High Score: {this.state.highScore}</div>
            <div>Your Picture</div>
            <img src={this.drawingURL} alt="Submitted Drawing" />
            <div>Picture of High Score</div>
            <img src={this.state.highScoreImage} alt="Drawing with current High Score" />
            <button onClick={this.tryAgain}>Try Again</button>
          </div>
          :
          ''
        }
      </div>
    );
  }
}

export default App;

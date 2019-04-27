import React, { Component } from 'react';
import './App.css';
import PokemonInfo from './PokemonInfo';
import DrawingArea from './DrawingArea';
import ResultsArea from './ResultsArea';
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

      drawnImage: null,
      distance: null,
      compareResult: null,
      highScore: null,
      highScoreImage: null,
    };

    // Number of Pokemon
    this.pokeCount = 802;
  }

  // Get a random pokemon from PokeAPI
  getRandPokemon = () => {
    let pokedexNum = Math.floor(Math.random() * (this.pokeCount - 1)) + 1;
    let pokeApiUrl = 'https://pokeapi.co/api/v2/';

    // Get the id, name, and sprite of the random pokemon
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

  // Displays the drawing canvas again so the user can submit another drawing
  tryAgain = () => {
    const drawingArea = document.getElementById("drawing-area");
    const resultsDiv = document.getElementById("results");
    drawingArea.classList.remove("hidden");
    resultsDiv.classList.add("hidden");

    this.setState({
      distance: null,
    });
  };

  // Randomly generates another pokemon
  newPokemon = () => {
    this.setState({
      pokemonNumber: null,
      pokemon: '',
      sprite: '',
      description: '',
      pokeGraph: null,
    });
    this.getRandPokemon();
    this.tryAgain();
  };

  // Set the result states with the parameters given
  setResults = (drawnImage, compareResult, dist, highScore, highScoreImage) => {
    this.setState({
      drawnImage: drawnImage, 
      compareResult: compareResult,
      distance: dist,
      highScore: highScore,
      highScoreImage: highScoreImage,
    });
  };

  componentDidMount = () => {
    // Get a random pokemon
    this.getRandPokemon();
  };

  render() {
    // If a random pokemon has been set but there is no graph yet, get the graph
    if(this.state.pokeGraph === null && this.state.pokemon !== '' && this.state.description !== '') {
      this.getGraphPokemon();
      console.log("get graph");
    }

    return (
      <div>
        <header id="header">
          <div className="page-wrapper flex-container">
            <h1 id="site-name"><a href="index.html">Draw that Pokemon!!!</a></h1>
            <nav id="main-nav">
              <h2 className="hidden">Main Navigation</h2>
              <ul className="menu">
                <li><a href="index.html">Home</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">Contact Me</a></li>
              </ul>
            </nav>
          </div>
        </header>

        <div id="instructions" className="page-wrapper">
          Welcome to Draw that Pokemon!!! Here you will 
          find a randomly generated pokemon's graph provided by 
          Wolfram Alpha. Your goal is to replicate the graph of the pokemon 
          on the canvas. Once you're done drawing, click Compare to see the
          results. (A result closer to 0 is better)
        </div>
        
        <button id="new-round-button" onClick={this.newPokemon}>Randomly Generate Another Pokemon</button>

        <PokemonInfo
          pokemon={this.state.pokemon}
          sprite={this.state.sprite}
          description={this.state.description}
        />

        <DrawingArea
          pokeGraph={this.state.pokeGraph}
          setResults={this.setResults}
          pokemonNumber={this.state.pokemonNumber}
        />

        <ResultsArea
          compareResult={this.state.compareResult}
          distance={this.state.distance}
          highScore={this.state.highScore}
          highScoreImage={this.state.highScoreImage}
          drawnImage={this.state.drawnImage}
          tryAgain={this.tryAgain}
        />

        <footer id="footer">
          <div className="page-wrapper">
            <p>HTTP5203 - Final Project - Raymond Giang - Section B - n01304390</p>
          </div>
        </footer>
      </div>
    );
  }
}

export default App;

import React, { Component } from 'react';

class PokemonInfo extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    // Info Area: Pokemon Name, Sprite, and Description
    return (
      <div id="pokemon-info">
        <div className="page-wrapper flex-container">
          <h2 id="pokemon-name">{this.props.pokemon}</h2>
          <img src={this.props.sprite} alt={"Picture of " + this.props.pokemon} />
          <p id="pokemon-description">{this.props.description}</p>
        </div>
      </div>
    );
  }
}

export default PokemonInfo;
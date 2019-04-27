require('dotenv').config();

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

// DeepAI
const deepai = require('deepai');
deepai.setApiKey(process.env.DEEPAI_KEY);

// Mongo Atlas Connection
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@testcluster-t9ymi.mongodb.net/test?retryWrites=true`;
const client = new MongoClient(uri, { useNewUrlParser: true });
let collection;

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to the pokemon scores database
client.connect(err => {
    collection = client.db("pokemonscores").collection("scores");
});

// 
let compareScores = (res, pokeNum, dist, image) => {
    let result;
    let highScore;
    let imagePath;

    collection.findOne({ pokemonID: pokeNum })
        .then(result => {
            if(result) {
                // New high score, Update Database Entry and Overwrite saved Image
                if(dist < result.score) {
                    collection.updateOne({ pokemonID: pokeNum },
                        { $set: { score: dist } }, (err, result) => {
                            if (err) throw err;
                        });
                    fs.writeFile(`high-scores/${pokeNum}.png`, image, {encoding: 'base64'}, async (err) => {
                        imagePath = fs.readFileSync(`high-scores/${pokeNum}.png`, { encoding: 'base64' });
                        res.send({
                            result: 'Congratulations, You have the high score!',
                            distance: dist,
                            highScore: dist,
                            highScoreImage: imagePath
                        });
                    });
                }
                // Did not beat the high score
                else {
                    imagePath = fs.readFileSync(`high-scores/${pokeNum}.png`, { encoding: 'base64' });
                    res.send({
                        result: 'Unfortunately you did not get a high score.',
                        distance: dist,
                        highScore: result.score,
                        highScoreImage: imagePath
                    });
                }
            }
            // New score, add database entry and save the image
            else {
                let newScore = { pokemonID: pokeNum, score: dist };
                collection.insertOne(newScore, (err, result) => {
                    if (err) throw err;
                });

                fs.writeFile(`high-scores/${pokeNum}.png`, image, {encoding: 'base64'}, async (err) => {
                    imagePath = fs.readFileSync(`high-scores/${pokeNum}.png`, { encoding: 'base64' });
                    res.send({
                        result: 'Congratulations, You have the high score!',
                        distance: dist,
                        highScore: dist,
                        highScoreImage: imagePath,
                    });
                });
            }
        })
        .catch(err => {
            console.log(err);
        });
};

// Runs when the user submits a drawn image, uses DeepAI to compare the two images
app.post('/saveImage', async (req, res) => {
    let base64Image = req.body.image;

    fs.writeFile("temp-drawings/test.png", base64Image, {encoding: 'base64'}, async (err) => {
        console.log('File created');

        let resp = await deepai.callStandardApi("image-similarity", {
            image1: fs.createReadStream("temp-drawings/test.png"),
            image2: req.body.graphImage,
        });

        let pokemonNumber = req.body.pokemonNumber;
        let distance = resp.output.distance;

        let result = compareScores(res, pokemonNumber, distance, base64Image);
    });
});

process.on('SIGINT', function() {
    client.close();
});

// for hosting on heroku
// https://medium.freecodecamp.org/how-to-make-create-react-app-work-with-a-node-backend-api-7c5c48acb1b0
if (process.env.NODE_ENV === 'production') {
    // Serve any static files
    app.use(express.static(path.join(__dirname, 'build')));

    // Handle React routing, return all requests to React app
    app.get('*', function(req, res) {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });
}

app.listen(port, () => console.log(`Listening on port ${port}`));
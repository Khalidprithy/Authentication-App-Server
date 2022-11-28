const express = require('express')
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;
// middle ware

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.2bb680r.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Verify jwt token

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        await client.connect();
        const usersCollection = client.db('node_auth_server').collection('users');
        console.log('db connected')
        // Store New User
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ result, token });
        })

        // Load all user
        app.get('/user', async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users)
        })

        // Find one user
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const users = await usersCollection.findOne({ email: email }).toArray();
            res.send(users)
        })
    }
    finally {

    }
}


run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Auth server')
})

app.get('/hello', (req, res) => {
    res.send('hello there')
})

app.listen(port, () => {
    console.log(`Authentication app listening on port ${port}`)
})
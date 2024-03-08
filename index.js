//Initial index.js setup for server
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');


//Middleware

app.use(cors({

    origin: [
        'https://studytogether204.web.app'
    ],
    credentials: true

}));
app.use(express.json());

//port
const port = process.env.PORT || 5000;

//For knowing that server is working or not
app.get("/", (req, res) => {

    res.send("Server is Running....")

});

//For knowing which port we are use
app.listen(port, () => {

    console.log(`Server is running on port ${port}`);

})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.33xa7ll.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
         client.connect();
        // Send a ping to confirm a successful connection

        const assignmentCollection = client.db('assignmentedDB').collection('assignmented');
        const usersCollection = client.db('usersDB').collection('users');
        const submitAssignmentCollection = client.db('submitDB').collection('submit');

        //Own MiddleWare
        //Verify Token

        const verifyToken = (req, res, next) => {

            if (!req.headers.authorization) {

                return res.status(401).send({ message: 'Forbidden Access' })

            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {

                if (err) {

                    return res.status(401).send({ message: 'Forbidden Access' })

                }
                req.decoded = decoded;
                next()

            })
        }
        // use verify admin after verifyToken
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }
        //JWT Related api
        app.post('/jwt', async (req, res) => {

            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {

                expiresIn: '1h'

            })
            res.send({ token })

        })

        //Post donation Data

        app.post('/assignment', async (req, res) => {

            const item = req.body;
            try {
                const result = await assignmentCollection.insertOne(item);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        })

        //Send A user data
        app.post('/users', async (req, res) => {

            const user = req.body;
            const query = { email: user.email }
            try {
                const existingUser = await usersCollection.findOne(query)
                if (existingUser) {
                    return res.send({ message: 'User already Exists', insertedId: null })
                }
                const result = await usersCollection.insertOne(user);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        })

        //Get A Assignment
        app.get('/assignment/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            try {
                const result = await assignmentCollection.findOne(query)
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        })

        // Get assignment Data by Date in Descending Order
        app.get('/assignment', async (req, res) => {
            try {
                const userEmail = req.query.email;
                const result = await assignmentCollection.find({ email: userEmail }).sort({ date: -1 }).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Get all Assignment Data by Date in Descending Order
        app.get('/assignmentAl', verifyToken, async (req, res) => {
            try {
                const userEmail = req.query.email;
                const result = await assignmentCollection.find({ ownerEmail: userEmail }).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });


        //Delete a Assignment
        app.delete('/assignment/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            try {
                const result = await assignmentCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        })

        //Update a Assignment
        app.patch('/assignment/:id', verifyToken, async (req, res) => {

            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    assignmentTitle: item.assignmentTitle,
                    difficulty: item.difficulty,
                    assignmentNumber: item.assignmentNumber,
                    longDescription: item.longDescription,
                    assignmentLastDate: item.assignmentLastDate,
                    assignmentImage: item.assignmentImage,
                }
            }
            try {
                const result = await assignmentCollection.updateOne(filter, updatedDoc);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        })


        // Get all Assignment Data by Date
        app.get('/allAssignment', async (req, res) => {
            try {
                const result = await assignmentCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });

        //Post Submit Assignment data
        app.post('/submitAssignment', async (req, res) => {

            const item = req.body;
            try {
                const result = await submitAssignmentCollection.insertOne(item);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        })

        // Get all Submitted Assignment Data by User Email
        app.get('/submitAssignment', verifyToken, async (req, res) => {
            try {
                const userEmail = req.query.email;
                const result = await submitAssignmentCollection.find({ email: userEmail }).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });

        //Get A Submitted Assignment
        app.get('/submitAssignment/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            try {
                const result = await submitAssignmentCollection.findOne(query);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        })

        //Delete a SubmittedAssignment
        app.delete('/submitAssignment/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            try {
                const result = await submitAssignmentCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        })

        // Get all Submitted Assignment Data by User Email
        app.get('/markAssignment', verifyToken, async (req, res) => {
            try {
                const userEmail = req.query.email;
                const result = await submitAssignmentCollection.find({ ownerEmail: userEmail }).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });

        //Make assignment complete
        app.patch('/mark/user/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                // Fetch the current document to check the current status
                const currentDoc = await submitAssignmentCollection.findOne(filter);
                if (!currentDoc) {
                    return res.status(404).json({ message: "Assignment not found" });
                }
                // Determine the new status based on the current status
                const newStatus = currentDoc.status === "pending" ? "Complete" : "pending";
                const updatedDoc = {
                    $set: {
                        status: newStatus
                    }
                };
                const result = await submitAssignmentCollection.updateOne(filter, updatedDoc);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });

        //Update Book data

        app.put('/mark/user/:id', async (req, res) => {

            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedMark = req.body;
            const mark = {
                $set: {
                    feedback: updatedMark.feedback,
                    marks: updatedMark.marks,
                }
            }
            try {
                const result = await submitAssignmentCollection.updateOne(filter, mark, options)
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

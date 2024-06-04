const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8mgufzz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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
        await client.connect();

        // user collection
        const userCollection = client.db("ZipParcel").collection("users");
        const bookingCollection = client.db("ZipParcel").collection("bookedParcel");


        // ----------------Users collection------------------
        // get for user role 
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email)
            const query = { email: email }
            const user = await userCollection.findOne(query);
            // console.log(user)
            res.send(user)
        })


        // post for Insert user info in database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const alreadyExist = await userCollection.findOne(query);
            if (alreadyExist) {
                return res.send({ message: 'User Already Exist', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })




        //-----------------------Booking Collection  Booked Parcel Related APis----------------



        // post method for insert Booked service form normal user menu
        app.post('/bookedParcel', async (req, res) => {
            const parcel = req.body;
            const result = await bookingCollection.insertOne(parcel);
            res.send(result);
        })

        // get all booking parcels from normal user My parcels page
        app.get('/bookedParcel', async (req, res) => {
            const result = await bookingCollection.find().toArray();
            res.send(result);
        })



        // By use get method to find single data from database
        app.get('/bookedParcel/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.findOne(query);
            res.send(result);
        })

        // by use patch update Booked parcel info
        app.patch('/bookedParcel/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            console.log(item, id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    userPhone: item.userPhone,
                    parcelType: item.parcelType,
                    parcelWeight: item.parcelWeight,
                    deliveryAddress: item.deliveryAddress,
                    requestedDate: item.requestedDate,
                    latitudes: item.latitudes,
                    longitude: item.longitude,
                    price: item.price,
                    receiverName: item.receiverName,
                    receiverPhone: item.receiverPhone,
                }
            }

            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result);


        })



        // by Use Delete method delete booked parcel from normal user My parcel page
        app.patch('/cancelParcel/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body;
            console.log(status, id)
            const query = { _id: new ObjectId(id) }
            const updateStatus = {
                $set: {
                  status: status.status
                },
            };
            const result = await bookingCollection.updateOne(query, updateStatus);
            res.send(result);
        })





        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('ZipParcel server running...');
})


app.listen(port, () => {
    console.log(`ZipParcel server is running at port:${port}`);
})
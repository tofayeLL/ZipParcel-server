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
        const reviewCollection = client.db("ZipParcel").collection("reviews");


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

        // by use get All book parcels find
        app.get('/bookedParcel', async (req, res) => {
            const result = await bookingCollection.find().toArray();
            res.send(result);
        })


        // post method for insert Booked service form normal user menu
        app.post('/bookedParcel', async (req, res) => {
            const parcel = req.body;
            const result = await bookingCollection.insertOne(parcel);
            res.send(result);
        })



        // By use POst method store review data get from user and store it in review collection
        app.post('/userReview', async (req, res) => {
            const parcel = req.body;
            const result = await reviewCollection.insertOne(parcel);
            res.send(result);
        })


        // get all booking parcels from normal user My parcels page
        app.get('/bookedParcel/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })



        // By use get method to find single data from database
        app.get('/updateParcel/:id', async (req, res) => {
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















        // by Use patch method cancel booked parcel status from normal user My parcel page
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






        // --------------Admin Routes apis--------------//
        // All users page aggregation
        app.get('/allParcels', async (req, res) => {
            const result = await userCollection.aggregate([
                /*   {
                      $lookup: {
                          from: 'bookedParcel',
                          localField: 'name',
                          foreignField: 'userName',
                          as: 'parcels'
                      }
                  },
                  {
                      $project: {
                          name: 1,
                          email: 1,
                          phone: 1, 
                          userType: 1,
                          parcel_count: { $size: '$parcels' }
                      }
                  } */


                //   aggregation by use booking collection 
                /* 
                                {
                                    $group: {
                                        _id: "$userEmail",
                                        totalParcels: { $sum: 1 },
                                        totalAmount: { $sum: "$price" }
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "_id",
                                        foreignField: "email",
                                        as: "userInfo"
                                    }
                                },
                                {
                                    $unwind: "$userInfo"
                                },
                                {
                                    $project: {
                                        _id: 0,
                                        userName: "$userInfo.name",
                                        userPhone: "$userInfo.phone",
                                        totalParcels: 1,
                                        totalAmount: 1
                                    }
                                } */


                /* 
                                 {
                                     $lookup: {
                                         from: "bookedParcel",
                                         localField: "email",
                                         foreignField: "userEmail",
                                         as: "parcels"
                                     }
                                 },
                                 {
                                     $addFields: {
                                         totalParcels: { $size: "$parcels" },
                                         totalAmount: { $sum: "$parcels.price" }
                                     }
                                 },
                                 {
                                     $project: {
                                         _id: 0,
                                         userName: "$name",
                                         userPhone: "$phone",
                                         totalParcels: 1,
                                         totalAmount: 1
                                     }
                                 } */


                {
                    $lookup: {
                        from: "bookedParcel",
                        localField: "email",
                        foreignField: "userEmail",
                        as: "parcels"
                    }
                },
                {
                    $addFields: {
                        totalParcels: { $size: "$parcels" },
                        totalAmount: { $sum: "$parcels.price" }
                    }
                },
                {
                    $group: {
                        _id: { name: "$name", phone: "$phone", email: "$email", userType: "$userType" },
                        totalParcels: { $first: "$totalParcels" },
                        totalAmount: { $first: "$totalAmount" }
                    }
                },
                {
                    $project: {
                        _id: 0,

                        userName: "$_id.name",
                        userPhone: "$_id.phone",
                        userEmail: "$_id.email",
                        userType: "$_id.userType",

                        totalParcels: 1,
                        totalAmount: 1
                    }
                },
                {
                    $sort: { "userName": 1 }
                }

            ]).toArray();
            res.send(result);
        }
        )




        // use put method for Admin menus modal from All parcels page manage  form page
        app.put('/manageBooked/:id', async (req, res) => {
            const id = req.params.id;
            const updateBookedInfo = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    approximateDate: updateBookedInfo.approximateDate,
                    deliveryMenID: updateBookedInfo.deliveryMenID,
                    status: updateBookedInfo.status
                },
            };

            const result = await bookingCollection.updateOne(filter, updateDoc, options);
            res.send(result);

        })


        // implement search depends on parcel request date by use post Method for admin menu
        app.post('/search', async (req, res) => {
            const { dateFrom, dateTo } = req.body;
            // console.log(dateFrom, dateTo)
            const result = await bookingCollection.find({
                requestedDate: {
                    $gte: dateFrom,
                    $lte: dateTo
                }
            }).toArray();
            // console.log(result)
            res.send(result);
        })



        // by use Patch method change or update user Type to deliverymen from admin all users page 
        app.patch('/makeDeliveryMen/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const filter = { email: email }
            const updateDoc = {
                $set: {
                    userType: 'DeliveryMen'
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        // by use Patch method change or update user Type to Admin from admin all users page 
        app.patch('/makeAdmin/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const filter = { email: email }
            const updateDoc = {
                $set: {
                    userType: 'Admin'
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })








        // ---------------Delivery Mens related apis------------------//

        // by use get method get from delivery men from all user collection
        app.get('/deliveryMen', async (req, res) => {
            const result = await userCollection.find({ userType: "DeliveryMen" }).toArray();
            res.send(result);

        })

        // by ue Get method get all deliveries by in logged in deliverymen for mY delivery list page
        app.get('/myDeliveries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { deliveryMenID: id };
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        // by use patch method (update status) cancel  from delivery Dashboard
        app.patch('/cancelDelivery/:id', async (req, res) => {
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


        // by use patch method (update status) deliver  from delivery Dashboard
        app.patch('/deliverParcel/:id', async (req, res) => {
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



        // By use post method count delivery by click delivered button from deliveryman page
        app.post('/deliveryCount/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const updateResult = await userCollection.updateOne(
                { _id: new ObjectId(id) },
                { $inc: { delivered: 1 } },
                { upsert: true }
            );
            /*  if (updateResult.modifiedCount === 0 && updateResult.upsertedCount === 0) {
                 return res.status(500).send({ message: 'Failed to update delivery count' });
             } */
            // console.log(updateResult);
            res.send(updateResult)
        })







        // -------Reviews collection apis----------------//

        // Get method for get All reviews from logged in delivery man
        app.get('/myReviews/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { deliveryMenID: id };
            const result = await reviewCollection.find(query).toArray();
            res.send(result)
        })



        // Post method for average all the reviews and set it to the user collection depends on deliverymen Id  when click review button and open modal then it will happen 
        app.post('/reviewAverage/:id', async (req, res) => {
            const deliveryMenID = req.params.id;
            console.log(deliveryMenID)
            const averageRating = await reviewCollection.aggregate([
                { $match: { deliveryMenID } },
                {
                    $group: {
                        _id: "$deliveryMenID",
                        averageRating: { $avg: "$rating" }
                    }
                },
                {
                    $project: {
                        averageRating: { $round: ["$averageRating", 2] },
                        _id: 0
                    }
                }
            ]).toArray();

            if (averageRating.length === 0) {
                return res.status(404).json({ message: "No reviews found for this delivery man." });
            }


            // Update the user collection with the calculated average rating
            const result = await userCollection.updateOne(
                { _id: new ObjectId(deliveryMenID) },
                { $set: { ratingAverage: averageRating[0].averageRating } }
            );

            res.send(result)
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
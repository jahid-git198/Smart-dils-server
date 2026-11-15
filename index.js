require("dotenv").config();


const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin")
// console.log( "admin", admin.initializeApp())
 
 

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
// jwt token acces 
const jwt = require("jsonwebtoken");
 



const serviceKey = process.env.FIREBASE_SECRETKEY;
const decoded = Buffer.from(serviceKey, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);
 
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});



// console.log("✅ Server Starting...");

// MongoDB Setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.apegouj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let productsCollection;
let UsersCollection;
let bidsCollection

// MongoDB Connectn
async function run() {
    try {
        await client.connect();
        const db = client.db("smart_db");
        productsCollection = db.collection("products");
        UsersCollection = db.collection("users")
        bidsCollection = db.collection("bids")
        // console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error("❌ MongoDB Error:", error);
    }
}

// 


//   firebase token accees and verify 





// ====================== ROUTES (খুব গুরুত্বপূর্ণ) ======================

// console.log("📌 Registering Routes...");
//  server data patay simple 
app.get("/", (req, res) => {
    res.send("Hello Jahid! Server is Working 🚀");
});

//  all bids ke get kore api kora holo 
app.get("/bids", async (req, res) => {
    try {


        const cursor = bidsCollection.find()
        const result = await cursor.toArray();

        res.send(result)

    } catch (error) {
        res.status(500).send({ message: "Error fetching bids" })

    }

})
//   product and bids collection 
app.get("/bids/:id", async (req, res) => {
    const id = req.params.id;

    const result = await bidsCollection
        .find({ product: id })
        .toArray();

    res.send(result);
});
//  post bids 
app.post("/bids", async (req, res) => {

    const result = await bidsCollection.insertOne(req.body)
    res.send(result)

})

//  bids delete 
app.delete("/bids/:id", async (req, res) => {
    try {
        const id = req.params.id
        console.log(id)
        const quary = { _id: new ObjectId(id) }
        const result = await bidsCollection.deleteOne(quary)
        res.send(result)

    } catch (error) {
        console.log(error)

    }
})

//  products details view get api 
app.get("/products/:id", async (req, res) => {
    try {
        const id = req.params.id;



        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                error: "Invalid ID format",
            });
        }

        const result = await productsCollection.findOne({
            _id: new ObjectId(id),
        });

        res.send(result);
    } catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
});




// Token Verify Middleware
const verifyToken = async (req, res, next) => {
    const token = req.headers?.authorization?.split(" ")?.[1];
    console.log({ token })

    if (!token) {
        return res.status(401).send({
            message: "Unauthorized: Token missing",
        });
    }


 

    const { email } = await admin.auth().verifyIdToken(token);
    console.log(email)









    next();

};


// sob data ke api hisabe patay browser 
app.get("/products", verifyToken, async (req, res) => {
    try {
        if (!productsCollection) {
            return res.status(500).send({
                message: "DB not ready",
            });
        }

        const result = await productsCollection.find({}).toArray();

        res.send(result);
    } catch (error) {
        console.error("Products Error:", error);

        res.status(500).send({
            message: "Error fetching products",
        });
    }
});
//   Recent Products get api 
app.get("/Recent-Product", async (req, res) => {
    const cursor = productsCollection.find().sort({ price_min: - 1 }).limit(6)
    const result = await cursor.toArray()
    // console.log(result)
    res.send(result)
})
//   Product  search 

// 


//  new data add kora hoi 
app.post("/products", async (req, res) => {
    try {
        if (!productsCollection) return res.status(500).send({ message: "DB not ready" });

        const newProduct = req.body;


        //  jaodi age teke email take tahle chekc korbe 
        //  const existingproducts = await productsCollection.findOne({
        //      email : newProduct.email
        //  })
        //  if(existingproducts){
        //      res.status(400).send( { message:"this email already exists "})
        //  }
        const result = await productsCollection.insertOne(newProduct);


        res.status(201).send(result);
    } catch (error) {
        // console.error("POST Error:", error);
        res.status(500).send({ message: "প্রোডাক্ট যোগ করতে সমস্যা হয়েছে" });
    }
});

//   datar objectId dore delete kora hoi 
app.delete("/products/:id", async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const result = await productsCollection.deleteOne(query)
        res.send(result)

    } catch (error) {
        console.error("Delete error :", error)
        res.status(500).send({ message: " Error deleting products" })
    }
})
//  data ubdate korar jonne put use kora hoi  but akane single data ubdate kora hoi 
app.patch("/products/:id", async (req, res) => {

    const id = req.params.id
    const updateuser = req.body
    const query = { _id: new ObjectId(id) }
    const updateDoc = {
        $set: updateuser
    }
    const result = await productsCollection.updateOne(query, updateDoc);
    res.send(result)

})
//   data ubdate korar jonne put use kora hoi 

app.put("/products/:id", async (req, res) => {
    const id = req.params.id
    const UbdatData = req.body
    const query = { _id: new ObjectId(id) }
    const result = await productsCollection.replaceOne(query, UbdatData)
    res.send(result)
})


//   user post , get , patch , delete 

app.post("/users", async (req, res) => {
    try {
        // console.log("UsersCollection:", UsersCollection);

        const result = await UsersCollection.insertOne(req.body);

        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});
//  get user 

app.get("/users", async (req, res) => {
    try {
        const cursor = UsersCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }


})

// console.log("✅ All Routes Registered Successfully!");

// Start Server
app.listen(port, () => {
    console.log(`✅ Local server is running on http://localhost:${port}`);
});

// Run DB Connection
run().catch(console.dir);
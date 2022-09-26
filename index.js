const express = require("express")
const app = express()
const jwt = require("jsonwebtoken")
var bodyParser = require('body-parser')
const cookieParser = require("cookie-parser")

app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())


const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'Abhi@123',
        database: 'blogapp'
    }
});

app.use(express.json())

// Create Table if not present in the Mysql database
knex.schema.hasTable("users").then(function (exists) {
    if (!exists) {
        return knex.schema.createTable("users", function (table) {
            table.increments("id").primary()
            table.string("name", 100)
            table.string("email", 100).unique()
            table.string("password", 100)
        }).then(() => {
            console.log("Users Table Created Successfully.");
        }).catch((err) => {
            console.log(err, "This Error is coming in creating Users Table.");
        })
    }
})


app.post("/signup", (req, res) => {
    const bodyData = req.body;
    knex('users').insert(bodyData).then((Data) => {
        bodyData['id'] = Data[0]
        res.send({ 'status': 'success', 'data': bodyData })
    }).catch((err) => {
        console.log(err, "Error Coming");
        res.send({ 'status': "error", 'message': err.sqlMessage })
    })
})


app.post("/login", (req, res) => {
    knex('users')
        .where({ email: req.body.email })
        .then((datauser) => {
            if (datauser.length == 0) {
                res.send("Invalid User")
            }
            else if (datauser[0].password == req.body.password) {
                const token = jwt.sign({ id: datauser[0].id, name: datauser[0].name, email: datauser[0].email }, "Secret Key");
                res.cookie('Token', token, { expiresIn: '24h' }).send('Your cookie is set');
            }
            else {
                res.send("Password is wrong")
            }
        }).catch((err) => {
            res.send(err, "email and Password is invalid.")
        })
})

/////Below will be the table for the Blogs

knex.schema.hasTable("blogs").then(function (exists) {
    if (!exists) {
        return knex.schema.createTable("blogs", function (tableblog) {
            tableblog.increments("id").primary()
            tableblog.integer('user_id', 11).unsigned().references('users.id');
            tableblog.string("title", 100).unique();
            tableblog.text("description")
            tableblog.timestamps(true, true)
        }).then(() => {
            console.log("Blog Table Created Successfully.");
        }).catch((err) => {
            console.log(err, "This Error is coming in creating Blog Table.");
        })
    }
})

//////Below is the table for the LIKE & DISLIKE

knex.schema.hasTable('likedislike').then(function (exists) {
    if (!exists) {
        return knex.schema.createTable("likedislike", function (tablelikedislike) {
            tablelikedislike.increments("id").primary()
            tablelikedislike.integer("blog_id", 20).unsigned().references("blogs.id")
            tablelikedislike.integer("user_id", 20).unsigned().references("users.id")
            tablelikedislike.boolean("likedislike", 20)
            tablelikedislike.timestamps(true, true)
        }).then(() => {
            console.log("Like-Dislike Table Created Successfuly.");
        }).catch((err) => {
            console.log(err, "There is some error.");
        })
    }
})


app.post("/createblog", (req, res) => {
    var reqtoken = req.cookies.Token
    if (reqtoken === undefined) {
        res.send({ 'status': 'JWT Not Provided' })
    }
    veriToken = jwt.verify(reqtoken, "Secret Key")
    const payload = req.body;
    payload.user_id = veriToken.id
    knex('blogs').insert(payload).then((Data) => {
        payload['id'] = Data[0]
        res.send({ 'status': 'success', 'data': payload })
    }).catch((err) => {
        console.log(err, "Error");
        res.send({ 'status': "error", 'message': err.sqlMessage })
    })

})

app.get('/getblog/:id', (req, res) => {
    var requesttoken = req.cookies.Token
    if (requesttoken === undefined) {
        res.send({ 'status': 'JWT Not Provided' })
    }
    verifyToken = jwt.verify(requesttoken, "Secret Key")
    const payloadupdate = req.body;
    payloadupdate.user_id = verifyToken.id
    knex('blogs')
        .where({ id: parseInt(req.params.id) })
        .then((data) => {
            if (data.length > 0) {
                res.send({ 'data': data, 'message': `${req.params.id} Blog Got successfully!` })
            } else {
                res.send({ 'message': `${req.params.id} Blog not found!`, 'errorCode': 404 })
            }
        }).catch((err) => {
            console.log(err, "Some Error Came in getting Blog.");
            res.send(err)
        })
})


app.get('/getallblogs', (req, res) => {
    var requesttoken = req.cookies.Token
    if (requesttoken === undefined) {
        res.send({ 'status': 'JWT Not Provided' })
    }
    verifyToken = jwt.verify(requesttoken, "Secret Key")
    const payloadupdate = req.body;
    payloadupdate.user_id = verifyToken.id
    knex('blogs').then((data) => {
        res.json(data)
    })
        .catch((err) => {
            console.log(err, "Blogs data error.");
        });
})


app.put('/updateblog/:id', (req, res) => {
    var requesttoken = req.cookies.Token
    if (requesttoken === undefined) {
        res.send({ 'status': 'JWT Not Provided' })
    }
    verifyToken = jwt.verify(requesttoken, "Secret Key")
    const payloadupdate = req.body;
    payloadupdate.user_id = verifyToken.id
    knex('blogs')
        .where({ id: req.params.id })
        .update({
            "title": req.body.title,
            "description": req.body.description,
        }).then((updatedata) => {
            if (!updatedata) {
                console.log(updatedata, "id not exists");
                res.send({ 'message': 'invalid id' })
            } else {
                console.log(updatedata, "Updated Successfull...");
                res.send("Data Updated")

            }
        }).catch((err) => {
            console.log(err, "Something went wrong");
        })
})


app.delete('/deleteblog/:id', (req, res) => {
    var requesttoken = req.cookies.Token
    if (requesttoken === undefined) {
        res.send({ 'status': 'JWT Not Provided' })
    }
    verifyToken = jwt.verify(requesttoken, "Secret Key")
    const payloadupdate = req.body;
    payloadupdate.user_id = verifyToken.id
    knex('blogs')
        .where({ id: parseInt(req.params.id) })
        .del()
        .then((delblog) => {
            if (delblog) {
                res.send({ 'data': delblog, 'message': `${req.params.id} Blog deleted successfully!` })
            } else {
                res.send({ 'message': `${req.params.id} Blog not found!`, 'errorCode': 404 })
            }
        }).catch((err) => {
            console.log(err, "Some Error Came...");
            res.send(err)
        })
})

app.post("/likedislikeblog", (req, res) => {
    var requesttoken = req.cookies.Token
    if (requesttoken === undefined) {
        res.send({ 'status': 'JWT Not Provided' })
    }
    verifyToken = jwt.verify(requesttoken, "Secret Key");
    const payloadlikedislike = req.body;
    payloadlikedislike.user_id = verifyToken.id
    const blogId = req.body.blog_id;
    knex('blogs').where({ id: blogId }).then((blogsdata) => {
        console.log(blogsdata);
        if (blogsdata.length == 0) {
            res.send("Blog doesen't exist.")
        }
        else if (blogsdata.length === 1) {
            knex('likedislike').where({ blog_id: blogId, user_id: payloadlikedislike.user_id }).update({
                "likedislike": req.body.likedislike
            }).then((updatedata) => {
                if (!updatedata) {
                    knex('likedislike').insert(payloadlikedislike).then((Data) => {
                        payloadlikedislike['id'] = Data[0]
                        res.send({ 'status': 'success', 'data': payloadlikedislike })
                    }).catch((err) => {
                        res.send({ 'status': 'Error', 'message': err.sqlMessage })
                    })
                } else {
                    console.log(updatedata, "LikeDislike Successfull...");
                    res.send("LikeDislike Updated")
                }
            }).catch((err) => {
                console.log(err, "Something went wrong");
            })
        }
    }).catch((err) => {
        res.send({ 'status': 'Error', 'message': err.sqlMessage })
    })
})

app.get("/likes", (req, res) => {
    var requesttoken = req.cookies.Token
    if (requesttoken === undefined) {
        res.send({ 'status': 'JWT Not Provided' })
    }
    verifyToken = jwt.verify(requesttoken, "Secret Key");
    const userId = verifyToken.id;
    console.log(userId, "userId..");
    knex('likedislike')
    .where('likedislike', 1)
    .andWhere('user_id', userId)
    .then((data) => {
        console.log(data.length, "-----total number of likes");
        res.send(data)
    }).catch((err) => {
        console.log(err, "Error in likes\n");
    })
})

app.get("/dislikes", (req, res) => {
    var requesttoken = req.cookies.Token
    if (requesttoken === undefined) {
        res.send({ 'status': 'JWT Not Provided' })
    }
    verifyToken = jwt.verify(requesttoken, "Secret Key");
    const payloadlikedislike = req.body;
    payloadlikedislike.user_id = verifyToken.id
    const blogId = req.body.blog_id;
    var requesttoken = req.cookies.Token
    if (requesttoken === undefined) {
        res.send({ 'status': 'JWT Not Provided' })
    }
    verifyToken = jwt.verify(requesttoken, "Secret Key");
    const userId = verifyToken.id;
    console.log(userId, "userId..");
    knex('likedislike')
        .where('likedislike', 0)
        .andWhere('user_id', userId)
        .then((data) => {
            console.log(data.length, "-----total number of dislikes");
            res.send(data)
        }).catch((err) => {
            console.log(err, "Error in dislikes\n");
        })
})

app.listen(3000, () => {
    console.log("Server is Running at Port 3000");
})
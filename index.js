const express = require("express");
const app = express();
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
// const nodepaths = require("node-all-paths");
const jspert = require("js-pert");
// Connection URL
const url = "mongodb://localhost:27017/";
// Database Name
const dbName = "Workshake";

async function createNode(task) {
  const node = {
    id: task.id,
    duration: task.duration,
    es: 0,
    ef: 0,
    ls: 0,
    lf: 0,
    slack: 0,
    successors: [],
    predecessors: [],
  };
  MongoClient.connect(url, function (err, client) {
    console.log("Connected successfully");
    const db = client.db(dbName);
    db.collection("TasksTrial").insertOne(node);
    client.close();
  });
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors());

app.post("/api/node", (req, res) => {
  const node = {
    id: req.body.id,
    duration: parseInt(req.body.duration),
  };
  createNode(node)
    .then(console.log(node.id + " added to database"))
    .catch((err) => console.log(err));
});
function arrayPredecessors(req) {
  const predecessorArr = [];
  req.body.selectedPredecessors.map((predecessors) => {
    predecessorArr.push(predecessors.value);
  });
  return predecessorArr;
}
function arraySuccessors(req) {
  const successorsArr = [];
  req.body.selectedSuccessors.map((successors) => {
    successorsArr.push(successors.value);
  });
  return successorsArr;
}
function forwardPass(node) {
  console.log(node);
}
app.get("/api/calculate", (req, res) => {
  try {
    MongoClient.connect(
      url,
      { useUnifiedTopology: true },
      async function (err, client) {
        if (err) throw err;
        console.log("connected");
        const db = client.db(dbName);
        // let val;
        try {
          await db
            .collection("TasksTrial")
            .find({})
            .toArray(function (err, array) {
              if (err) throw err;
              let tasksObject = {
                St: {
                  id: "St",
                  optimisticTime: 0,
                  mostLikelyTime: 0,
                  pessimisticTime: 0,
                  predecessors: [],
                },
              };
              array.map((elem) => {
                if (elem.id !== "St" && elem.id !== "Fi") {
                  tasksObject[elem.id] = {
                    id: elem.id,
                    optimisticTime: elem.duration - 2,
                    mostLikelyTime: elem.duration,
                    pessimisticTime: elem.duration + 2,
                    predecessors: elem.predecessors,
                  };
                }

                // const pert = jspert.jsPERT(tasksObject);
                // console.log("PERT", pert);
              });
              const finalRes = {
                statusCode: 200,
                headers: {
                  "Access-Control-Allow-Origin": "localhost:",
                  "Access-Control-Allow-Methods": "GET",
                  "Content-Security-Policy":
                    "connect-src http://localhost:3001",
                },
                body: tasksObject,
              };
              return finalRes;
            });
        } catch (err) {
          console.log(err);
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});
app.put("/api/edges", (req, res) => {
  try {
    MongoClient.connect(
      url,
      { useUnifiedTopology: true },
      async function (err, client) {
        if (err) throw err;
        console.log("connected successfully");
        let response;
        const db = client.db(dbName);

        try {
          await db
            .collection("TasksTrial")
            .find({ id: req.body.selectedNode[0].value })
            .toArray(async function (err, result) {
              if (err) {
                return res.status(500).send(err);
              } else {
                try {
                  // console.log(arrayPredecessors(req));
                  // console.log(result[0].predecessors);
                  result[0].predecessors = arrayPredecessors(req);
                  result[0].successors = arraySuccessors(req);
                  response = result[0];

                  await db
                    .collection("TasksTrial")
                    .updateOne(
                      { id: result[0].id },
                      { $set: response },
                      { upsert: true }
                    );
                  const finalRes = {
                    statusCode: 200,
                    headers: {
                      "Access-Control-Allow-Origin": "localhost:",
                      "Access-Control-Allow-Methods": "GET",
                      "Content-Security-Policy":
                        "connect-src http://localhost:3001",
                    },
                    body: response,
                  };
                  console.log(response);
                  return finalRes;
                } catch (err) {
                  console.log(err);
                }
              }
            });
        } catch (err) {
          console.log(err);
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/nodes", (req, res) => {
  try {
    MongoClient.connect(
      url,
      { useUnifiedTopology: true },
      async function (err, client) {
        if (err) throw err;
        console.log("Connected Successfully to server");
        const db = client.db(dbName);
        try {
          await db
            .collection("TasksTrial")
            .find({})
            .toArray(async function (err, result) {
              if (err) {
                return res.status(500).send(err);
              } else {
                try {
                  const response = {
                    statusCode: 200,
                    headers: {
                      "Access-Control-Allow-Origin": "localhost:",
                      "Access-Control-Allow-Methods": "GET",
                      "Content-Security-Policy":
                        "connect-src http://localhost:3001",
                    },
                    body: result,
                  };
                  console.log(response);
                  res.send(response);
                } catch (err) {
                  console.log(err);
                }
              }
            });
        } catch (err) {
          console.log(err);
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

const port = 3000;
const server = require("http").Server(app);
server.listen(port, () => console.log(`listening on port ${port}...`));
module.exports = server;

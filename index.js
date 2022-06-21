/* eslint-disable no-unused-vars */
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');

var app = express();
app.use(cors());

// use JSON
app.use(bodyParser.json());

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// connect to the database
async function conn() {
  await prisma.$connect();
}

// disconnects to the database
async function disconn() {
  await prisma.$disconnect();
}

// PORT
const port = process.env.PORT || 8080

// === SERVER ===


// ====== CREATE ======
// ###### POST ROUTES ######

// Create new user
app.post('/Signup', async (req, res) => {
  conn();

  const newUser = await prisma.users.create({
    data: req.body
  });

  res.send({
    status: res.statusCode,
    valid: true
  });

  disconn();
});

// Creates a new subject
app.post('/MainApp', async (req, res) => {
  conn();

  const user = await prisma.users.findFirst({
    where: {
      id: {
        equals: req.query.id
      }
    }
  });

  const subjectCounts = user.subjects.length;

  const usera = await prisma.users.update({
    where: {
      id: req.query.id
    },
    data: {
      subjects: {
        push: {
          color: req.query.color,
          id: subjectCounts + 1,
          isFavorite: false,
          name: req.query.name,
          workspaces: [],
          owned: true
        }
      }
    }
  });

  res.send(usera);
  disconn();
});

// Creates a new workspace
app.post('/MainApp/:subjectName', async (req, res) => {
  conn();

  const userA = await prisma.users.findFirst({
    where: {
      AND: {
        id: {
          equals: req.query.id
        },
        subjects: {
          some: {
            name: req.params.subjectName,
            id: parseInt(req.query.sID)
          }
        }
      }
    }
  });

  // Assign the resulting user to a variable to be able to edit it 
  const user = userA;

  // Find the subject by subject name and sID & assign or add the value of subject's workspaces to newWorkspaces
  user.subjects.forEach(subject => {
    if (subject.id == req.query.sID && subject.name === req.params.subjectName) {
      subject.workspaces.push({
        boards: [
          {
            color: "grey",
            createdBy: `${user.firstName} ${user.lastName}`,
            createdOn: new Date(),
            id: 1,
            name: "Todo",
            tasks: []
          },
          {
            color: "info",
            createdBy: `${user.firstName} ${user.lastName}`,
            createdOn: new Date(),
            id: 1,
            name: "In progress",
            tasks: []
          },
          {
            color: "success",
            createdBy: `${user.firstName} ${user.lastName}`,
            createdOn: new Date(),
            id: 1,
            name: "Done",
            tasks: []
          },
        ],
        color: req.query.color,
        id: subject.workspaces.length + 1,
        isFavorite: false,
        members: [],
        name: req.query.name,
        owned: true
      });
    }
  });

  // set the new data of user to userB and then send the userB
  const userB = await prisma.users.update({
    where: {
      id: req.query.id
    },
    data: {
      age: user.age,
      course: user.course,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      password: user.password,
      profile: user.profile,
      school: user.school,
      subjects: user.subjects,
      useHint: user.useHint,
      year: user.year
    }
  });
  res.send(userB);
  disconn();
});



// ====== READ ======
// Get route

// Gets all user from database
app.get('/', async (req, res) => {
  conn();
  const allUsers = await prisma.users.findMany();
  res.send(allUsers);
  disconn();
});

// Gets only password to sign in
app.get('/Signin', async (req, res) => {
  conn();
  const pass = await prisma.users.findFirst({
    select: {
      password: true
    },
    where: {
      email: {
        equals: req.query.email
      }
    }
  });
  res.send(pass);
  disconn();
});

// Gets the user based on the email
app.post('/validUser', async (req, res) => {
  conn();
  const user = await prisma.users.findFirst({
    where: {
      email: {
        equals: req.body.email
      }
    }
  });

  res.send(user);
  disconn();
});

// ====== UPDATE ======
// Updates subjects
app.put('/Subjects/edits', async (req, res) => {
  conn();
  const user = await prisma.users.findFirst({
    where: {
      AND: {
        email: {
          equals: req.body.email
        },
        id: {
          equals: req.body.id
        }
      }
    }
  });

  let userCopy = user;
  userCopy.subjects[req.body.subject_id - 1] = req.body.updated_subject;

  const usera = await prisma.users.update({
    where: {
      id: userCopy.id
    },
    data: {
      subjects: {
        set: userCopy.subjects,
      }
    }
  });

  res.send(userCopy);
  disconn();
});

// ====== DELETE ======

app.listen(port, function () {
  console.log("Started application backend on port %d", port);
});
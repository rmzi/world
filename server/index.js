const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory data store
let works = [
    { id: 1, title: 'Project Alpha', date: '2023-01-01', subtitle: 'A cool project', content: 'This is the description of Project Alpha.', image: '' },
    { id: 2, title: 'Project Beta', date: '2023-06-15', subtitle: 'Another project', content: 'Description for Beta.', image: '' }
];
let bio = { id: 1, text: "Hi, I'm Rmzi. I create digital experiences." };

// Middleware to mimic total count header (often required by React-Admin simple rest provider)
app.use((req, res, next) => {
    res.header('Access-Control-Expose-Headers', 'X-Total-Count');
    next();
});

// Works Routes
app.get('/works', (req, res) => {
    res.set('X-Total-Count', works.length);
    res.json(works);
});

app.get('/works/:id', (req, res) => {
    const work = works.find(w => w.id == req.params.id);
    if (work) res.json(work);
    else res.status(404).send('Not found');
});

app.post('/works', (req, res) => {
    const newWork = { id: works.length + 1, ...req.body };
    works.push(newWork);
    res.json(newWork);
});

app.put('/works/:id', (req, res) => {
    const index = works.findIndex(w => w.id == req.params.id);
    if (index !== -1) {
        works[index] = { ...works[index], ...req.body };
        res.json(works[index]);
    } else {
        res.status(404).send('Not found');
    }
});

app.delete('/works/:id', (req, res) => {
    works = works.filter(w => w.id != req.params.id);
    res.json({ id: req.params.id });
});

// Bio Routes
// Treating Bio as a singleton resource or a list of 1? React-Admin usually likes lists. 
// Let's expose it as a resource, but usually we just want one bio.
app.get('/bio', (req, res) => {
    res.set('X-Total-Count', 1);
    res.json([bio]);
});

app.get('/bio/:id', (req, res) => {
    res.json(bio);
});

app.put('/bio/:id', (req, res) => {
    bio = { ...bio, ...req.body };
    res.json(bio);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

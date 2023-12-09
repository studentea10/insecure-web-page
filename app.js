// app.js
const express = require('express');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// SQLite database setup
const db = new sqlite3.Database(':memory:');

// Create a users table with insecure implementation
db.run('CREATE TABLE users (id INT, username TEXT, password TEXT)');

// Create a blog table with insecure implementation
db.run('CREATE TABLE blog_posts (id INT, title TEXT, content TEXT)');

// Insecure route for user login with SQL injection vulnerability
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;

  db.get(sql, (err, row) => {
    if (row) {
      // Redirect to the blog page upon successful login
      res.redirect('/blog');
    } else {
      res.send('Login failed. Invalid credentials.');
    }
  });
});

// Insecure route for displaying user data with Reflected XSS
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`Search results for: ${query}`);
});

// Insecure route for displaying user data with DOM Based XSS
app.get('/dom-xss', (req, res) => {
  const input = req.query.input;
  res.send(`<p>${input}</p>`);
});

// Insecure route for storing user data with Stored XSS
app.post('/post-message', (req, res) => {
  const message = req.body.message;
  // Insecure: Directly storing user input in the response
  res.send(`Message posted: ${message}`);
});

// Registration page
app.get('/register', (req, res) => {
  res.render('register');
});

// Register a new user
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const sql = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;

  db.run(sql, (err) => {
    if (!err) {
      // Redirect to the blog page if registered successfully 
      res.redirect('/blog');
    } else {
      res.send('Registration failed. Please try again.');
    }
  });
});

// Login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Blog page
app.get('/blog', (req, res) => {
  const sql = 'SELECT * FROM blog_posts';

  db.all(sql, (err, rows) => {
    if (!err) {
      res.render('blog', { posts: rows });
    } else {
      res.send('Error fetching blog posts.');
    }
  });
});

// Create a new route for blog post
app.get('/blog/new', (req, res) => {
  res.render('new-post');
});

// Create a new blog post route
app.post('/blog/new', (req, res) => {
  const { title, content } = req.body;
  const sql = `INSERT INTO blog_posts (title, content) VALUES ('${title}', '${content}')`;

  db.run(sql, (err) => {
    if (!err) {
      // Go to the blog page after creating a post successfully.
      res.redirect('/blog');
    } else {
      res.send('Error creating a new blog post. Please try again.');
    }
  });
});

// Edit blog post form route
app.get('/blog/edit/:id', (req, res) => {
  const postId = req.params.id;
  const sql = `SELECT * FROM blog_posts WHERE id = ${postId}`;

  db.get(sql, (err, row) => {
    if (!err && row) {
      res.render('edit-post', { post: row });
    } else {
      res.send('Error fetching blog post for editing.');
    }
  });
});

// Edit blog post route
app.post('/blog/edit/:id', (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;
  const sql = `UPDATE blog_posts SET title='${title}', content='${content}' WHERE id=${postId}`;

  db.run(sql, (err) => {
    if (!err) {
      // After the post edit is successful, reroute to the blog page.
      res.redirect('/blog');
    } else {
      res.send('Error editing the blog post. Please try again.');
    }
  });
});

// 404 route - Page not found
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

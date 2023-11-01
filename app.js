const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use("/minio/static", express.static(path.join(__dirname, "routes/static"), { setHeaders: (res, path) => {
    if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
    }
} }));


app.use(express.static(path.join(__dirname, 'routes/static')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/home'));
app.use('/minio', require('./routes/minio'));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

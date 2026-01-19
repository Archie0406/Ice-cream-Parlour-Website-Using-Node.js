const http = require('http'); // create a server
const fs = require('fs'); // read files from our computer
const url = require('url'); //understand website links
const path = require('path'); //build safe file paths

// reads a JSON file and converts it into usable JavaScript data.
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'dev-data/data.json'), 'utf-8')
);
const dataObj = data.products;

// Read templates
const overviewTemplate = fs.readFileSync(
  path.join(__dirname, 'templates/template-overview.html'),
  'utf-8'
);
const productTemplate = fs.readFileSync(
  path.join(__dirname, 'templates/template-product.html'),
  'utf-8'
);
const notFoundTemplate = fs.readFileSync(
  path.join(__dirname, 'html/404.html'),
  'utf-8'
);

// Helper function to replace template placeholders
const replaceTemplate = (template, product) => {
  let output = template;

  // Replace all product data placeholders
  output = output.replace(/{%PRODUCTNAME%}/g, product.name);
  output = output.replace(/{%IMAGE%}/g, `/images/${product.image}`); 
  output = output.replace(/{%PRICE%}/g, product.price);
  output = output.replace(/{%ORIGIN%}/g, product.category);
  output = output.replace(/{%DESCRIPTION%}/g, product.description);
  output = output.replace(/{%ID%}/g, product.id);
  output = output.replace(/{%RATING%}/g, product.rating);
  output = output.replace(/{%REVIEWS%}/g, product.reviews);

  return output;
};

// function tells the browser what type of file it is.
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase(); // Get the file extension like .css, .jpg
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[ext] || 'application/octet-stream'; //unknown, send a default type.
};

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`); // Break the URL into readable parts.
  const pathname = parsedUrl.pathname; // Get path like /product.
  const query = Object.fromEntries(parsedUrl.searchParams); // Get query values like { id: "2" }.

  // ROUTE 1: Overview page (/)
  if (pathname === '/' || pathname === '/overview') { // user visits home page.
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); // Tell browser: “Everything is OK and this is HTML”.

    const cardsHtml = dataObj // Create product cards for all products.
      .map((product) => replaceTemplate(productTemplate, product)) 
      .join('');

    const output = overviewTemplate.replace(/{%PRODUCT_CARDS%}/g, cardsHtml); // Put all cards into overview page.
    res.end(output); // Send the page to the browser.
  }

  // ROUTE 2: Product detail page (/product)
  else if (pathname === '/product') {
    const id = query.id; // Get product ID from URL.

    if (id && id >= 0 && id < dataObj.length) { // Check if ID is valid.
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      const product = dataObj[id]; // Pick that product.
      const output = replaceTemplate(productTemplate, product); // Fill HTML with product info.
      res.end(output);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); 
      res.end(notFoundTemplate); // If wrong ID, show 404 page.
    }
  }

  // ROUTE 3: API - JSON data (/api)
  else if (pathname === '/api') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(dataObj)); // Send product data as JSON.
  }

  // ROUTE 4: Serve CSS files (/public/...)
  else if (pathname.startsWith('/public/')) { // Serve CSS and public files.
    const filePath = path.join(__dirname, pathname); 

    fs.readFile(filePath, (err, data) => { // Read the requested file.
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' }); 
        res.end('404 - File not found');
        return;
      }

      const mimeType = getMimeType(filePath); // Get correct MIME type.
      res.writeHead(200, { 'Content-Type': mimeType }); // Send correct content type.
      res.end(data);
    });
  }

  // ROUTE 5: Serve images (/images/... or /img/...)
  else if (pathname.startsWith('/images/') || pathname.startsWith('/img/')) { // Serve images.
    let filePath;

    if (pathname.startsWith('/images/')) {
      filePath = path.join(__dirname, 'images', decodeURIComponent(pathname.replace('/images/', ''))); // Decode URL-encoded characters
    } else {
      filePath = path.join(__dirname, 'images', decodeURIComponent(pathname.replace('/img/', '')));
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Image not found');
        return;
      }

      const mimeType = getMimeType(filePath); 
      res.writeHead(200, { 'Content-Type': mimeType }); 
      res.end(data);
    });
  }

  // ROUTE 6: Serve HTML files from html folder (/html/... or just /filename)
  else if (pathname.startsWith('/html/')) {
    const filePath = path.join(__dirname, pathname);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(notFoundTemplate);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  }

  // ROUTE 7: 404 - Not found
  else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(notFoundTemplate);
  }
});

// Start server
const PORT = 8000; // Port number to listen on
server.listen(PORT, '127.0.0.1', () => { // Start the server
  console.log(`Server running on http://localhost:${PORT}`); // Log server start message
});

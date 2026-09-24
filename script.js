const express = require('express');
const app = express();
const multer = require('multer');
const sharp = require('sharp');

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up the upload endpoint
const upload = multer({ dest: 'uploads/' });

// Define the search endpoint
app.post('/search', upload.single('file'), (req, res) => {
    // Get the uploaded PDF file
    const file = req.file;

    // Use sharp to extract the text from the PDF
    const pdfText = sharp(file.buffer)
        .then((page) => {
            return page.toBuffer()
                .then((buffer) => buffer.toString('utf8'))
                .then((text) => {
                    // Split the text into an array of paragraphs
                    const paragraphs = text.split('\n');

                    // Search for "github.com/" within each paragraph
                    const results = paragraphs.map((paragraph) => {
                        const index = paragraph.indexOf('github.com/');
                        if (index !== -1) {
                            // Extract 100 words before and after the query
                            const start = index - 100;
                            const end = index + 100;
                            if (start < 0) {
                                return { text: paragraph.slice(0, 100), index: 0, position: 'start' };
                            } else if (end > paragraph.length) {
                                return { text: paragraph.slice(-100), index: -100, position: 'end' };
                            } else {
                                return { text: paragraph.slice(start, end), index, position: 'middle' };
                            }
                        } else {
                            return { text: '', index: -1, position: '' };
                        }
                    });

                    // Filter out the results with no "github.com/" found
                    const filteredResults = results.filter(result => result.text);

                    // Display the results
                    if (filteredResults.length > 0) {
                        let searchResults = '';
                        filteredResults.forEach((result, index) => {
                            if (result.index > 0) {
                                searchResults += `<p>Paragraph ${index + 1}: ${result.text}</p>`;
                            } else if (result.position === 'start') {
                                searchResults += `<p>Paragraph ${index + 1}: ...</p>`;
                            } else if (result.position === 'end') {
                                searchResults += `<p>Paragraph ${index + 1}: ...</p>`;
                            } else if (result.position === 'middle') {
                                searchResults += `<p>Paragraph ${index + 1}: ${result.text}</p>`;
                            }
                        });
                        res.send({ result: searchResults });
                    } else {
                        res.send({ result: 'Not found.' });
                    }
                })
                .catch((err) => {
                    // Handle any errors
                    console.error(err);
                    res.status(500).send({ error: 'Error processing PDF' });
                });
});

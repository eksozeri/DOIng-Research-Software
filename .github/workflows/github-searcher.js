// github-searcher.js
const { execFileSync } = require('child_process');

const uploadDir = process.env.UPLOAD_DIR;
const pdfSearchQuery = 'github.com/';

exports.githubSearcher = async (event) => {
  try {
    const file = new URLSearchParams(event.data).get('file');
    if (!file) {
      return { statusCode: 400, body: 'No file provided' };
    }

    const fileContent = await execFileSync('zcat', [file]);
    if (fileContent.includes(pdfSearchQuery)) {
      const before = fileContent.toString().slice(0, 100);
      const after = fileContent.toString().slice(fileContent.indexOf(pdfSearchQuery) + pdfSearchQuery.length, -100);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: before + after
      };
    } else {
      return { statusCode: 404, body: 'Not found' };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Error processing file'
    };
  }
};

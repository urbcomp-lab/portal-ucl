import { parse } from 'astrocite-bibtex';
import { readFile } from 'fs/promises';

function bibToJSON(bib) {   
    const parsed = parse(bib);
    return parsed;
}

async function readFileFromDisk(filename) {
    var file = readFile(filename);
    return file;
}

async function runConverter(filename){
    const bib = await readFile(filename, 'utf8');
    const json = bibToJSON(bib);
    const fixed = fixDatePartsLattes(json);
    return fixed;
}

function fixDatePartsLattes(publications){
    // enter in json and fix the date parts
    // issued/date-parts
    
    return publications.map((publication) => {
        const dateParts = publication.issued['date-parts'][0];
        const year = dateParts[0] || "1900";
        const month = dateParts[1] || "1";
        const day = dateParts[2] || "1";
        publication.issued = {
            'date-parts': [[year, month, day]]
        }
        return publication;
    });

}

const args = process.argv.slice(2);
const filename = args[0];
runConverter(filename).then((json) => {
    console.log(JSON.stringify(json, null, 2));    
});


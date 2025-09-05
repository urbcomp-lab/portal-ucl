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

function cleanInvalidAuthors(publications) {
    return publications.map(pub => {
        if (pub.author && Array.isArray(pub.author)) {
            pub.author = pub.author.filter(author => {
                // Check if the author object is valid to begin with
                if (!author) {
                    console.error(`WARNING: Found a null/invalid author entry in publication: '${pub.title || 'Unknown Title'}'`);
                    return false; // Remove null or undefined entries
                }

                // The definitive check:
                // 1. The 'family' key must exist and not be an empty string.
                // 2. The 'given' key must exist and not be an empty string.
                const hasFamily = author.family && author.family.trim() !== '';
                const hasGiven = author.given && author.given.trim() !== '';
                const isValid = hasFamily && hasGiven;

                // If the author is invalid, create a detailed log
                if (!isValid) {
                    const givenName = author.given || '[GIVEN NAME MISSING]';
                    const familyName = author.family || '[FAMILY NAME MISSING]';
                    const problematicName = `${givenName} ${familyName}`.trim();

                    console.error(`--> ISSUE FOUND: Removing author '${problematicName}'`);
                    console.error(`    In publication: '${pub.title || 'Unknown Title'}'`);
                    console.error(`    Author data: ${JSON.stringify(author)}\n`);
                }

                return isValid;
            });

            // If the publication is left with no authors, also warn
            if (pub.author.length === 0) {
                console.error(`--> WARNING: The publication '${pub.title || 'Unknown Title'}' has no valid authors left after cleanup.\n`);
            }
        }
        return pub;
    });
}

async function runConverter(filename){
    const bib = await readFile(filename, 'utf8');
    const json = bibToJSON(bib);
    const fixed = fixDatePartsLattes(json);
    const cleanedAuthors = cleanInvalidAuthors(fixed);
    return cleanedAuthors;
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

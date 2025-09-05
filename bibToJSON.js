import { readFile } from 'fs/promises';
import { Parser } from 'xml2js';

function parseAuthorName(citationName) {
    if (!citationName || !citationName.includes(',')) {
        return null;
    }
    const parts = citationName.split(',');
    const family = parts[0].trim();
    const given = parts[1].trim();

    if (!family || !given) {
        return null;
    }

    return { family, given };
}

async function runConverter(filename) {
    const xmlData = await readFile(filename, 'utf8');
    const parser = new Parser({ explicitArray: false, mergeAttrs: true });
    const result = await parser.parseStringPromise(xmlData);

    const publications = [];

    // Process papers in proceedings
    const papersInProceedings = result['CURRICULO-VITAE']['PRODUCAO-BIBLIOGRAFICA']['TRABALHOS-EM-EVENTOS']['TRABALHO-EM-EVENTOS'] || [];
    (Array.isArray(papersInProceedings) ? papersInProceedings : [papersInProceedings]).forEach(item => {
        const details = item['DADOS-BASICOS-DO-TRABALHO'];
        const authors = (Array.isArray(item['AUTORES']) ? item['AUTORES'] : [item['AUTORES']]);

        const cslItem = {
            type: 'paper-conference', // ✅ required by citeproc-php
            title: details['TITULO-DO-TRABALHO'],
            issued: {
                'date-parts': [[details['ANO-DO-TRABALHO'] || '1900']]
            },
            author: authors
                .map(author => parseAuthorName(author['NOME-PARA-CITACAO']))
                .filter(author => author !== null)
        };
        publications.push(cslItem);
    });

    // Process journal articles
    const journalArticles = result['CURRICULO-VITAE']['PRODUCAO-BIBLIOGRAFICA']['ARTIGOS-PUBLICADOS']['ARTIGO-PUBLICADO'] || [];
    (Array.isArray(journalArticles) ? journalArticles : [journalArticles]).forEach(item => {
        const details = item['DADOS-BASICOS-DO-ARTIGO'];
        const authors = (Array.isArray(item['AUTORES']) ? item['AUTORES'] : [item['AUTORES']]);

        const cslItem = {
            type: 'article-journal', // ✅ required by citeproc-php
            title: details['TITULO-DO-ARTIGO'],
            issued: {
                'date-parts': [[details['ANO-DO-ARTIGO'] || '1900']]
            },
            author: authors
                .map(author => parseAuthorName(author['NOME-PARA-CITACAO']))
                .filter(author => author !== null)
        };
        publications.push(cslItem);
    });

    const finalPublications = publications.filter(pub => pub.author && pub.author.length > 0);

    return finalPublications;
}

const args = process.argv.slice(2);
const filename = args[0];

runConverter(filename).then((json) => {
    console.log(JSON.stringify(json, null, 2));
}).catch(err => {
    console.error("An error occurred during XML to JSON conversion:", err);
    process.exit(1);
});

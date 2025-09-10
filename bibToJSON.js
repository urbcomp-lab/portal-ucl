#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import { Buffer } from 'buffer';
import { Parser } from 'xml2js';

function parseAuthorName(citationName) {
    if (!citationName || !citationName.includes(',')) return null;

    const parts = citationName.split(',');
    const family = parts[0].trim();
    const given = parts[1].trim();
    if (!family || !given) return null;

    return { family, given };
}

async function runConverter(filename) {
    const rawData = await readFile('curriculo.xml');
    const xmlData = rawData.toString('latin1');
    const parser = new Parser({ explicitArray: false, mergeAttrs: true });
    const result = await parser.parseStringPromise(xmlData);

    const publications = [];

    const papersInEvents = result['CURRICULO-VITAE']['PRODUCAO-BIBLIOGRAFICA']['TRABALHOS-EM-EVENTOS']['TRABALHO-EM-EVENTOS'] || [];
    (Array.isArray(papersInEvents) ? papersInEvents : [papersInEvents]).forEach(item => {
        const details = item['DADOS-BASICOS-DO-TRABALHO'];
        if (!details) return;

        const authors = (Array.isArray(item['AUTORES']) ? item['AUTORES'] : [item['AUTORES']]);
        const cslItem = {
            type: 'paper-conference',
            title: details['TITULO-DO-TRABALHO'],
            issued: { 'date-parts': [[details['ANO-DO-TRABALHO'] || '1900']] },
            author: authors.map(a => parseAuthorName(a['NOME-PARA-CITACAO'])).filter(a => a !== null)
        };

        if (details['NOME-DO-EVENTO']) cslItem['container-title'] = details['NOME-DO-EVENTO'];

        publications.push(cslItem);
    });

    const journalArticles = result['CURRICULO-VITAE']['PRODUCAO-BIBLIOGRAFICA']['ARTIGOS-PUBLICADOS']['ARTIGO-PUBLICADO'] || [];
    (Array.isArray(journalArticles) ? journalArticles : [journalArticles]).forEach(item => {
        const details = item['DADOS-BASICOS-DO-ARTIGO'];
        if (!details) return;

        const authors = (Array.isArray(item['AUTORES']) ? item['AUTORES'] : [item['AUTORES']]);
        const cslItem = {
            type: 'article-journal',
            title: details['TITULO-DO-ARTIGO'],
            issued: { 'date-parts': [[details['ANO-DO-ARTIGO'] || '1900']] },
            author: authors.map(a => parseAuthorName(a['NOME-PARA-CITACAO'])).filter(a => a !== null)
        };

        if (details['NOME-DO-PERIODICO']) cslItem['container-title'] = details['NOME-DO-PERIODICO'];

        publications.push(cslItem);
    });

    return publications.filter(pub => pub.author && pub.author.length > 0);
}

const args = process.argv.slice(2);
const filename = args[0];

runConverter(filename)
    .then(json => writeFile('publications.json', JSON.stringify(json, null, 2), 'utf8'))
    .then(() => console.log('✅ publications.json gerado com sucesso!'))
    .catch(err => {
        console.error('❌ Erro durante a conversão XML -> JSON:', err);
        process.exit(1);
    });

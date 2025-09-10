<?php
header('Content-Type: text/html; charset=utf-8');

require "vendor/autoload.php";

use Seboettg\CiteProc\StyleSheet;
use Seboettg\CiteProc\CiteProc;

function groupByYear($data) {
    $grouped = [];
    foreach ($data as $item) {
        $year = $item->issued->{'date-parts'}[0][0] ?? '1900';
        if (!isset($grouped[$year])) $grouped[$year] = [];
        $grouped[$year][] = $item;
    }
    return $grouped;
}

function printYearSection($year, $items, $citeProc) {
    echo "<div class='row justify-content-center'>
            <div class='col-lg-10'>
                <div class='section-title text-center pb-20'>
                    <h3 class='title'>$year</h3>
                    <div class='line m-auto'></div>
                </div>
            </div>
          </div>";

    echo $citeProc->render($items, "bibliography");
}

try {
    $dataString = file_get_contents("publications.json");
    if ($dataString === false) throw new Exception("Erro ao ler publications.json");

    $dataString = mb_convert_encoding($dataString, 'UTF-8', 'UTF-8');
    $data = json_decode($dataString);
    if (json_last_error() !== JSON_ERROR_NONE) throw new Exception("Erro ao decodificar JSON: " . json_last_error_msg());

    $style = StyleSheet::loadStyleSheet("harvard-cite-them-right");
    $citeProc = new CiteProc($style, "en-US");

    $grouped = groupByYear($data);
    krsort($grouped);

    foreach ($grouped as $year => $papers) {
        printYearSection($year, $papers, $citeProc);
    }

} catch (Exception $e) {
    echo "Error loading papers: " . $e->getMessage();
}
?>

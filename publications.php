<?php
include "vendor/autoload.php";
use Seboettg\CiteProc\StyleSheet;
use Seboettg\CiteProc\CiteProc;

function groupByYear($data) {
    $grouped = array();
    foreach ($data as $item) {
        $year = $item->issued->{'date-parts'}[0][0];
        if (!array_key_exists($year, $grouped)) {
            $grouped[$year] = array();
        }
        array_push($grouped[$year], $item);
    }
    return $grouped;
}

function printYearSection($year, $items, $citeProc) {
    echo "<div class=\"row justify-content-center\">
        <div class=\"col-lg-10\">
            <div class=\"section-title text-center pb-20\">
                <h3 class=\"title\">$year</h3>
                <div class=\"line m-auto\"></div>
            </div> <!-- section title -->
        </div>
    </div>";
    echo $citeProc->render($items, "bibliography");
}

try {
    $dataString = file_get_contents("publications.json");
    $style = StyleSheet::loadStyleSheet("harvard-cite-them-right");
    $citeProc = new CiteProc($style, "en-US");
    $data = json_decode($dataString);
    $grouped = groupByYear($data);
    krsort($grouped);

    foreach ($grouped as $year => $papers) {
        printYearSection($year, $papers, $citeProc);
    }


    // $bibliography = $citeProc->render($data, "bibliography");

} catch (Exception $e) {
    echo "Error loading papers: " . $e->getMessage() . "\n";
    echo "In file: " . $e->getFile() . " on line " . $e->getLine() . "\n";
}
?>

<?php
include "vendor/autoload.php";
use Seboettg\CiteProc\StyleSheet;
use Seboettg\CiteProc\CiteProc;

function groupByYear($data) {
    $grouped = array();
    foreach ($data as $item) {
        $year = "Sem ano";

        if (isset($item->issued) && isset($item->issued->{'date-parts'})) {
            $dateParts = $item->issued->{'date-parts'};
            if (is_array($dateParts) && isset($dateParts[0][0])) {
                $year = $dateParts[0][0];
            }
        }

        if (!array_key_exists($year, $grouped)) {
            $grouped[$year] = array();
        }
        $grouped[$year][] = $item;
    }
    return $grouped;
}

function printYearSection($year, $items, $citeProc) {
    echo "<div class=\"row justify-content-center\">
        <div class=\"col-lg-10\">
            <div class=\"section-title text-center pb-20\">
                <h3 class=\"title\">$year</h3>
                <div class=\"line m-auto\"></div>
            </div>
        </div>
    </div>";

    echo "<pre>--- [DEBUG] Publicações do ano: $year ---\n";
    foreach ($items as $item) {
        $title = $item->title ?? "TÍTULO NÃO ENCONTRADO";
        echo "[DEBUG] Título: $title\n";

        $authors_json = isset($item->author) ? json_encode($item->author) : "SEM AUTORES";
        echo "[DEBUG] Autores: $authors_json\n";
    }
    echo "--- [DEBUG] Fim do ano $year ---</pre>";

    echo $citeProc->render($items, "bibliography");
}

try {
    $dataString = file_get_contents("publications.json");
    if ($dataString === false) {
        throw new Exception("Error reading file publications.json!");
    }

    $style = StyleSheet::loadStyleSheet("harvard-cite-them-right");
    $citeProc = new CiteProc($style, "en-US");

    $data = json_decode($dataString);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Erro ao decodificar o JSON: " . json_last_error_msg());
    }

    $grouped = groupByYear($data);
    krsort($grouped);

    foreach ($grouped as $year => $papers) {
        printYearSection($year, $papers, $citeProc);
    }

} catch (Exception $e) {
    echo "Error loading papers: " . $e->getMessage() . "<br>";
    echo "In file: " . $e->getFile() . " on line " . $e->getLine() . "<br>";
}
?>

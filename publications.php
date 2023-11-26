<?php

include "vendor/autoload.php";

use Seboettg\CiteProc\StyleSheet;
use Seboettg\CiteProc\CiteProc;

try {
    $dataString = file_get_contents("publications.json");
    $style = StyleSheet::loadStyleSheet("harvard-cite-them-right");
    $citeProc = new CiteProc($style, "en-US");
    $data = json_decode($dataString);
    $bibliography = $citeProc->render($data, "bibliography");
    $cssStyles = $citeProc->renderCssStyles();
} catch (Exception $e) {
    echo $e->getMessage();
    die;
}

$bibliography; ?>
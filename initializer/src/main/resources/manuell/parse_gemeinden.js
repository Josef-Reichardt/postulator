// Step 1: http://www.regierung.niederbayern.bayern.de/niederbayern/bez_lkr_staedte_gemeinden/index.php
var data = [];
document.querySelectorAll('table.full.abstandunten').forEach(table => {
    var landkreis = table.previousSibling;
    while(!landkreis.innerText) {
         landkreis = landkreis.previousSibling;
    }
    landkreis = landkreis.innerText;
    table.querySelectorAll('tr').forEach(row => {
        var rowData = row.querySelectorAll('td');
        if(rowData[0]) {
            data.push({
                landkreis,
                gemeinde: rowData[0].innerText,
                adresse: rowData[1].innerText,
                kontakt: rowData[2].innerText,
                email: rowData[2].innerText.match(/.*@.*/gim) ? rowData[2].innerText.replace(/[\r\n]+/gim, ' ').replace(/^.*E-Mail: (.*)$/gim, '$1') : null
            });
        }
    });
});
document.body.innerHTML += '<p style="border: 1px solid red;">'+JSON.stringify(data)+'</p>';
// --> gemeinden.json

// --> http://www.factfish.com/de/einwohnerzahl/niederbayern/gemeinden
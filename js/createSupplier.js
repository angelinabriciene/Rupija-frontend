const apiUrl = 'http://localhost:8090/api/tiekejai';

try {
    document.getElementById("submitSupplier").addEventListener("click", function (event) {
        saveSupplier();
        event.preventDefault();
    });
} catch (Exception) { }

async function saveSupplier() {
    const name = document.getElementById('supplierName').value;
    const supplierCode = document.getElementById('supplierCode').value;
    const supplierTaxCode = document.getElementById('supplierTaxCode').value;
    const supplierBankAcc = document.getElementById('supplierBankAcc').value;
    const adress = document.getElementById('supplierAddress').value;

    const supplier = {
        name,
        supplierCode,
        supplierTaxCode,
        supplierBankAcc,
        adress
    };
    
    try {
        await axios.post(apiUrl, supplier);
        window.location.href = "http://127.0.0.1:5500/views/suppliers.html?info=u";
        showAlert("Tiekėjas išsaugotas");
    } catch (error) {
        console.error('Error saving supplier:', error);
    }
}